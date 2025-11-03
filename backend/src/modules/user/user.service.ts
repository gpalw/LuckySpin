// backend/src/modules/user/user.service.ts
import { prisma } from '../../db/prisma';
import { Provider, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import e from 'express';

const SALT_ROUNDS = 10;

type UserInput = {
    email: string;
    name?: string;
    avatarUrl?: string;
    provider: Provider;
    providerId: string;
};

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

    // 创建用户
    const newUser = await createUser(username, passwordHash, role);

    return newUser;
};

/**
 * 创建新用户 通过外部提供商 (Google, Facebook, GitHub 等)
 */
export const upsertFromProvider = async (userInput: UserInput) => {
    const { email, name, avatarUrl, provider, providerId } = userInput;

    // 1. 检查用户是否已存在 (唯一性)
    const existingUser = await prisma.user.findUnique({
        where: { username: email }, include: { identities: true }
    });
    if (existingUser) {
        const identity = existingUser.identities.find(i => i.provider === provider);
        if (!identity) {
            // 添加新的身份提供商关联
            await prisma.userIdentity.create({
                data: {
                    userId: existingUser.id,
                    provider: provider,
                    providerUserId: providerId,
                }
            });
        }
        return existingUser;
    } else {
        const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), SALT_ROUNDS);

        // 3. 创建用户
        const newUser = await createUser(email, passwordHash, Role.OPERATOR, provider, providerId);

        return newUser;
    }

};

async function createUser(
    username: string,
    passwordHash: string,
    role: Role,
    provider?: Provider,
    providerId?: string
) {
    return prisma.user.create({
        data: {
            username,
            passwordHash,
            role,
            identities: {
                create: [
                    { provider: Provider.LOCAL, providerUserId: username },
                    ...(provider && providerId
                        ? [{ provider, providerUserId: providerId }]
                        : []),
                ],
            },
        },
        select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });
}
