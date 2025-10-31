import { z } from 'zod';

// 创建轮盘的校验
export const createRouletteSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        theme: z.string().optional(), // 主题是可选的
    }),
});

// 更新轮盘状态的校验
export const updateRouletteStatusSchema = z.object({
    body: z.object({
        // 确保 status 是我们 schema.prisma 中定义的枚举值
        status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED']),
    }),
});