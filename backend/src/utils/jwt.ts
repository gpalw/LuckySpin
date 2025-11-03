import jwt, { SignOptions } from 'jsonwebtoken';
import { User, Role } from '@prisma/client';
import { AuthSubject } from '@/types/express/jwt.types';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface JwtPayload {
    id: string;
    username: string | undefined;
    role: Role;
}

/**
 * 签发 JWT
 */
export const signToken = (subject: AuthSubject): string => {
    const payload: JwtPayload = {
        id: subject.id,
        username: subject.username ?? undefined,
        role: subject.role,
    };

    const secret = JWT_SECRET as jwt.Secret;

    return jwt.sign(payload, secret, {
        expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
};

/**
 * 验证 JWT
 */
export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};