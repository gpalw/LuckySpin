import { prisma } from '../../db/prisma';

// PrizeCreateInput 接口，从 Zod 自动推断
import { z } from 'zod';
import { createPrizeSchema, updatePrizeSchema } from './prize.validation';

// 'body' 部分的类型
type PrizeCreateData = z.infer<typeof createPrizeSchema>['body'];
type PrizeUpdateData = z.infer<typeof updatePrizeSchema>;


/**
 * 为指定轮盘添加新奖品
 * @param rouletteId 轮盘 ID (string)
 * @param prizeData 奖品数据
 */
export const addPrizeToRoulette = async (
    rouletteId: string,
    prizeData: PrizeCreateData
) => {
    return prisma.prize.create({
        data: {
            ...prizeData, // 包含所有奖品字段
            roulette: {     // 关联到轮盘
                connect: {
                    id: rouletteId,
                },
            },
        },
    });
};

/**
 * 更新奖品信息 (例如, 更新库存)
 * @param prizeId 奖品 ID (string)
 * @param prizeData 要更新的数据
 */
export const updatePrize = async (
    prizeId: string,
    prizeData: PrizeUpdateData
) => {
    return prisma.prize.update({
        where: { id: prizeId },
        data: prizeData,
    });
};

/**
* (可选) 删除奖品
*/
export const deletePrize = async (prizeId: string) => {
    return prisma.prize.delete({
        where: { id: prizeId },
    });
};

/**
* 获取单个轮盘下的所有奖品
*/
export const getPrizesForRoulette = async (rouletteId: string) => {
    return prisma.prize.findMany({
        where: { rouletteId: rouletteId },
        orderBy: { createdAt: 'asc' },
    });
};