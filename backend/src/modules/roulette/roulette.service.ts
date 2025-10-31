import { prisma } from '../../db/prisma';
import { Role, RouletteStatus } from '@prisma/client';

/**
 * 获取所有轮盘 (包含奖品)
 */
export const getAllRoulettes = async () => {
    return prisma.roulette.findMany({
        include: {
            prizes: true,  // 附带奖品信息
            _count: {      // 统计奖品数量
                select: { prizes: true }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });
};

/**
 * 创建新轮盘
 * @param data 轮盘数据 { name, theme }
 * @param ownerId 创建者的 ID (来自 req.user)
 */
export const createRoulette = async (
    data: { name: string; theme?: string },
    ownerId: string // ID 必须是 string
) => {

    // (在你的 seed.ts 中，你确认了 Roulette 和 User 之间有 'owner' 关联)
    return prisma.roulette.create({
        data: {
            name: data.name,
            theme: data.theme || 'default', // 默认主题
            status: 'DRAFT', // 默认是草稿
            // 关联创建者
            owner: {
                connect: {
                    id: ownerId,
                },
            },
        },
    });
};

/**
 * 根据 ID 获取单个轮盘 (包含其所有奖品)
 */
export const getRouletteById = async (rouletteId: string) => {
    const roulette = await prisma.roulette.findUnique({
        where: { id: rouletteId },
        include: {
            prizes: {
                orderBy: {
                    createdAt: 'asc', // 奖品按创建时间排序
                },
            },
            owner: { // 顺便加载创建者信息
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });

    if (!roulette) {
        throw new Error('Roulette not found');
    }
    return roulette;
};

/**
 * 更新轮盘状态
 */
export const updateRouletteStatus = async (
    rouletteId: string,
    status: RouletteStatus
) => {

    return prisma.roulette.update({
        where: { id: rouletteId },
        data: { status },
        include: {
            prizes: {
                orderBy: {
                    createdAt: 'asc',
                },
            },
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
        }
    });
};

/**
* 删除一个轮盘
 */
export const deleteRoulette = async (rouletteId: string, actorId: string) => {

    // (在真实生产中, 我们不会 "真" 删除, 而是设一个 isDeleted: true)
    // (但根据 spec, 我们先实现 "真" 删除)

    // 我们必须 "手动" 删除所有 'Prize' 记录
    await prisma.prize.deleteMany({ where: { rouletteId: rouletteId } });
    // ---  ↑↑↑  修复结束  ↑↑↑  ---

    // 2. (安全起见) 我们必须先删除所有 "子记录"
    // (因为你的 schema 里 DrawRecord/Session/AuditLog 上的 rouletteId 不是可选的, 它们会阻止删除)
    await prisma.drawRecord.deleteMany({ where: { rouletteId: rouletteId } });
    await prisma.session.deleteMany({ where: { rouletteId: rouletteId } });
    await prisma.auditLog.deleteMany({ where: { rouletteId: rouletteId } });

    // 3. 最后, 删除轮盘本身
    // (现在所有外键都解除了, 这一步会成功)
    return prisma.roulette.delete({
        where: { id: rouletteId },
    });
};

/**
 * 根据用户角色和ID获取轮盘列表
 * @param actorId 当前用户的 ID
 * @param actorRole 当前用户的角色
 */
export const getRoulettesService = async (actorId: string, actorRole: Role) => {

    // 1. 定义查询条件 (where clause)
    let whereCondition: any = {};

    // 2. 【核心逻辑】如果用户不是 ADMIN (管理员)，则只查询 ownerId 匹配的轮盘
    if (actorRole !== Role.ADMIN) {
        whereCondition = {
            ownerId: actorId,
        };
    }
    // 如果是 ADMIN，whereCondition 保持为空对象 {}，即查询所有数据

    // 3. 执行查询
    const roulettes = await prisma.roulette.findMany({
        where: whereCondition, // 应用筛选条件
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            _count: {
                select: { prizes: true },
            },
        },
    });

    // 格式化并返回
    return roulettes.map(roulette => ({
        ...roulette,
        prizeCount: roulette._count.prizes,
        _count: undefined,
    }));
};