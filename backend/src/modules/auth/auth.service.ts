import { prisma } from '../../db/prisma';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { signToken } from '../../utils/jwt';

/**
 * 登录服务
 */
export const loginService = async (
    username: string,
    password: string
): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> => {

    // 1. 查找用户
    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        // 统一错误信息，防止用户名嗅探
        throw new Error('Invalid credentials');
    }

    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    // 3. 签发 JWT
    const token = signToken(user);

    // 4. 记录审计日志 (异步，不阻塞登录)
    prisma.auditLog.create({
        data: {
            action: 'USER_LOGIN_SUCCESS',
            actorId: user.id,
            payload: { username: user.username },
        }
    }).catch(console.error); // 记录日志失败不应导致登录失败

    // 5. 移除敏感信息
    const { passwordHash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};