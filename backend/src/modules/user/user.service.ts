// backend/src/modules/user/user.service.ts
import { prisma } from '../../db/prisma';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * 创建新用户 (仅限管理员使用)
 */
export const createUserService = async (username: string, passwordPlain: string, role: Role) => {
    // 1. 检查用户是否已存在 (唯一性)
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        throw new Error('User already exists');
    }

    // 2. 哈希密码
    const passwordHash = await bcrypt.hash(passwordPlain, SALT_ROUNDS);

    // 3. 创建用户
    const newUser = await prisma.user.create({
        data: {
            username,
            passwordHash,
            role,
        },
        // 返回时排除密码哈希
        select: { id: true, username: true, role: true, isActive: true, createdAt: true },
    });

    return newUser;
};