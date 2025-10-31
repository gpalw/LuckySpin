import { prisma } from '../../db/prisma';
import { Prize, RouletteStatus, SessionState } from '@prisma/client';
import crypto from 'crypto'; // 用于安全的随机数

/**
 * 激活一个抽奖会话 (锁定设备)
 * @param rouletteId 轮盘 ID
 * @param operatorId 操作员 ID (来自 req.user.id)
 * @param deviceInfo 设备信息 (e.g., "iPad-001")
 */
export const activateSession = async (
    rouletteId: string,
    operatorId: string,
    deviceInfo: string | null | undefined
) => {
    // 1. 检查轮盘状态
    const roulette = await prisma.roulette.findUnique({
        where: { id: rouletteId },
    });

    if (!roulette) {
        throw new Error('Roulette not found');
    }
    if (roulette.status !== RouletteStatus.ACTIVE) {
        throw new Error('Roulette is not active. Please ask an admin to activate it.');
    }

    // 2. 检查是否已有其他设备锁定了这个轮盘
    const existingActiveSession = await prisma.session.findFirst({
        where: {
            rouletteId: rouletteId,
            state: SessionState.ACTIVE,
        },
    });

    if (existingActiveSession) {
        // 如果是同一个设备 (且 deviceInfo 存在)，直接返回现有会话
        if (
            deviceInfo &&
            existingActiveSession.deviceInfo === deviceInfo
        ) {
            return existingActiveSession;
        }
        // 如果是不同设备，抛出锁定错误
        throw new Error('This roulette is already in use by another device.');
    }

    // 3. 创建新会话
    const newSession = await prisma.session.create({
        data: {
            rouletteId: rouletteId,
            operatorId: operatorId,
            deviceInfo: deviceInfo,
            state: SessionState.ACTIVE,
        },
    });

    return newSession;
};

/**
 * 查找并返回中奖奖品 (加权随机)
 * (此函数保持不变，(p.weight || 1) 是安全的)
 */
const getWeightedWinner = (prizes: Prize[]): Prize | null => {
    const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 0), 0);
    if (totalWeight === 0) return null;
    let randomWeight = crypto.randomInt(0, totalWeight);
    for (const prize of prizes) {
        randomWeight -= (prize.weight || 1);
        if (randomWeight < 0) return prize;
    }
    return null;
};


/**
 * 执行抽奖（核心事务）
 * @param rouletteId 轮盘 ID
 * @param operatorId 操作员 ID (来自 req.user.id)
 * @param deviceInfo 设备信息
 * @param idempotencyKey 幂等键
 * @param lang 语言 ('zh' or 'en')
 */
export const performDraw = async (
    rouletteId: string,
    operatorId: string,
    deviceInfo: string | null | undefined,
    idempotencyKey: string,
) => {
    // 1. 查找此设备对应的激活会话
    // (我们仍然需要会话 ID 来创建 DrawRecord)
    const session = await prisma.session.findFirst({
        where: {
            rouletteId: rouletteId,
            operatorId: operatorId,
            deviceInfo: deviceInfo, // 匹配 deviceInfo
            state: SessionState.ACTIVE,
        },
    });

    if (!session) {
        throw new Error('No active session found for this device and roulette.');
    }

    // 2. --- 启动事务 ---
    // (注意：'result' 变量现在被正确推断为 'Prize' 类型)
    const result = await prisma.$transaction(async (tx) => {

        // 3. 幂等性检查：是否已经抽过了？
        // 你的 schema 'idempotencyKey' 是 @unique 的, 这是正确的查询方式
        const existingRecord = await tx.drawRecord.findUnique({
            where: {
                idempotencyKey: idempotencyKey,
            },
            include: { prize: true },
        });

        if (existingRecord) {
            if (!existingRecord.prize) {
                throw new Error('Draw record found but the associated prize is missing.');
            }
            return existingRecord.prize;
        }

        // 4. 获取所有奖品
        const allPrizes = await tx.prize.findMany({
            where: { rouletteId: rouletteId },
        });

        const fallbackPrize = allPrizes.find(
            (p) => p.name.toLowerCase() === 'thanks for playing'
        );

        // 5. 找出所有 "可中奖" 的奖品
        // (p.stock === null) 意思是 "无限库存"
        const winnablePrizes = allPrizes.filter(
            (p) => (p.weight || 0) > 0 && (p.stock === null || (p.stock || 0) > 0)
        );

        if (winnablePrizes.length === 0) {
            return null;
        }

        let selectedPrize: Prize;

        // 6. 加权随机
        const winner = getWeightedWinner(winnablePrizes);
        if (!winner) {
            // (理论上不应发生, 但作为安全兜底)
            // 如果 getWeightedWinner 失败了, 也返回 null
            return null;
        } else {
            selectedPrize = winner;
        }
        selectedPrize = winner || fallbackPrize; // 没抽中就给 fallback

        // 7. 扣减库存 (如果中的不是 "谢谢参与" 且 库存不是null)
        if (selectedPrize.id !== null) {
            const updateResult = await tx.prize.updateMany({
                where: {
                    id: selectedPrize.id,
                    stock: { gt: 0 }, // 原子性检查
                },
                data: {
                    stock: { decrement: 1 },
                },
            });

            if (updateResult.count === 0) {
                return null;
            }
        }
        // ---  签名逻辑 ---
        const SIGNATURE_KEY = process.env.JWT_SECRET || 'fallback_secret';
        const dataToSign = rouletteId + selectedPrize.id + idempotencyKey;
        const signature = crypto.createHmac('sha256', SIGNATURE_KEY)
            .update(dataToSign)
            .digest('hex');

        // 8. 记录中奖 Log
        await tx.drawRecord.create({
            data: {
                rouletteId: rouletteId,
                prizeId: selectedPrize.id,
                sessionId: session.id,
                idempotencyKey: idempotencyKey,
                prizeName: selectedPrize.name,
                prizeWinMessage: selectedPrize.win_message,

                signature: signature,

            },
        });

        // 9. 返回中奖奖品
        return selectedPrize;
    }); // --- 事务结束 ---

    if (result === null) {
        // (返回一个特殊的 "无奖品" 对象, 前端会识别它)
        return {
            prizeId: "NO_PRIZE", // (特殊 ID)
            name: "It's a pity",
            message: "All prizes have been drawn!"
        };
    }

    return {
        prizeId: result.id,
        name: result.name,
        message: result.win_message,
    };
};