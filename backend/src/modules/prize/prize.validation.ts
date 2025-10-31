import { z } from 'zod';

// 创建奖品的校验 (用在 POST /roulettes/:id/prizes)
export const createPrizeSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        win_message: z.string().min(1),
        stock: z.number().int().min(0).default(0), // 库存必须是 >= 0 的整数
        weight: z.number().int().min(1).default(1), // 权重必须是 >= 1 的整数
    }),
});

// 更新奖品库存的校验 (用在 PATCH /prizes/:prizeId)
export const updatePrizeStockSchema = z.object({
    body: z.object({
        // 允许只更新库存，所以其他字段可选
        stock: z.number().int().min(0),
    }),
});

// (可选) 更新完整奖品信息的校验
export const updatePrizeSchema = createPrizeSchema.shape.body.partial(); // 所有字段可选