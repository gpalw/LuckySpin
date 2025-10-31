import { z } from 'zod';

// 激活会话的校验
export const activateSessionSchema = z.object({
    body: z.object({
        deviceInfo: z.string().optional(),
    }),
});

// 执行抽奖的校验
export const drawSchema = z.object({
    body: z.object({
        // 幂等键，防止前端重复提交
        idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
        deviceInfo: z.string().optional(),
    }),
});