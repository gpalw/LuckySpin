import { prisma } from '../../db/prisma';
import { Prize, RouletteStatus, SessionState } from '@prisma/client';
import crypto from 'crypto';

/**
 * 激活一个抽奖会话 (锁定设备)
 */
export const activateSession = async (
    rouletteId: string,
    operatorId: string,
    deviceInfo: string | null | undefined
) => {
    const roulette = await prisma.roulette.findUnique({
        where: { id: rouletteId },
    });

    if (!roulette) {
        throw new Error('Roulette not found');
    }
    if (roulette.status !== RouletteStatus.ACTIVE) {
        throw new Error('Roulette is not active. Please ask an admin to activate it.');
    }

    const existingActiveSession = await prisma.session.findFirst({
        where: {
            rouletteId: rouletteId,
            state: SessionState.ACTIVE,
        },
    });

    if (existingActiveSession) {
        if (deviceInfo && existingActiveSession.deviceInfo === deviceInfo) {
            return existingActiveSession;
        }
        throw new Error('This roulette is already in use by another device.');
    }

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
 * 加权随机抽奖
 */
const getWeightedWinner = (prizes: Prize[]): Prize | null => {
    const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 0), 0);
    if (totalWeight === 0) return null;

    let randomWeight = crypto.randomInt(0, totalWeight);

    for (const prize of prizes) {
        randomWeight -= (prize.weight || 0);
        if (randomWeight < 0) return prize;
    }

    return null;
};

/**
 * 执行抽奖（核心事务）
 */
export const performDraw = async (
    rouletteId: string,
    operatorId: string,
    deviceInfo: string | null | undefined,
    idempotencyKey: string,
) => {
    // 1. 查找激活会话
    const session = await prisma.session.findFirst({
        where: {
            rouletteId: rouletteId,
            operatorId: operatorId,
            deviceInfo: deviceInfo,
            state: SessionState.ACTIVE,
        },
    });

    if (!session) {
        throw new Error('No active session found for this device and roulette.');
    }

    // 2. 启动事务
    const result = await prisma.$transaction(async (tx) => {
        // 3. 幂等性检查
        const existingRecord = await tx.drawRecord.findUnique({
            where: { idempotencyKey: idempotencyKey },
            include: { prize: true },
        });

        if (existingRecord) {
            // 如果已经存在相同的幂等键，直接抛错，避免重复抽奖
            throw new Error(`Duplicate draw attempt. Previous result: ${existingRecord.prizeName}`);
        }

        // 4. 获取所有有库存的奖品
        const winnablePrizes = await tx.prize.findMany({
            where: {
                rouletteId: rouletteId,
                weight: { gt: 0 },
                OR: [
                    { stock: null },           // 无限库存
                    { stock: { gt: 0 } }       // 或有库存
                ]
            },
        });

        // 5. 如果没有可抽的奖品了
        if (winnablePrizes.length === 0) {
            return null;
        }

        // 6. 加权随机抽奖
        const selectedPrize = getWeightedWinner(winnablePrizes);

        if (!selectedPrize) {
            return null;
        }

        // 7. 扣减库存（只处理有限库存的奖品）
        if (selectedPrize.stock !== null) {
            const updateResult = await tx.prize.updateMany({
                where: {
                    id: selectedPrize.id,
                    stock: { gt: 0 },
                },
                data: {
                    stock: { decrement: 1 },
                },
            });

            // 如果扣减失败（并发导致库存不足），返回 null
            if (updateResult.count === 0) {
                return null;
            }
        }

        // 8. 生成签名
        const SIGNATURE_KEY = process.env.JWT_SECRET || 'fallback_secret';
        const dataToSign = rouletteId + selectedPrize.id + idempotencyKey;
        const signature = crypto.createHmac('sha256', SIGNATURE_KEY)
            .update(dataToSign)
            .digest('hex');

        // 9. 记录抽奖
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

        // 10. 返回中奖奖品
        return selectedPrize;
    });

    // 如果没抽到（所有奖品都没库存了）
    if (result === null) {
        return {
            prizeId: "NO_PRIZE",
            name: "Sorry",
            message: "All prizes have been drawn! Please try again later."
        };
    }

    return {
        prizeId: result.id,
        name: result.name,
        message: result.win_message,
    };
};