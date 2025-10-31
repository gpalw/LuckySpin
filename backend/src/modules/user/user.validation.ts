// backend/src/modules/user/user.validation.ts
import { z } from 'zod';

export const createUserSchema = z.object({
    body: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters long'),
        password: z.string().min(6, 'Password must be at least 6 characters long'),
        // 允许创建 ADMIN 或 OPERATOR 账号
        role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
    }),
});