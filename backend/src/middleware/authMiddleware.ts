import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { Role } from '@prisma/client';

/**
 * 认证中间件 (检查 Token 是否有效)
 * 会将 payload 附加到 req.user
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);

        req.user = payload; // 附加用户信息
        next();
    } catch (error) {
        // 这会捕获 verifyToken 抛出的 'Invalid or expired token' 错误
        // 并将其传递给全局错误处理器 (errorHandler)
        next(error);
    }
};

/**
 * 授权中间件 (检查角色)
 * 必须在 'authenticate' 之后使用
 * @param allowedRoles 允许的角色数组 (e.g., [Role.ADMIN])
 */
export const authorize = (allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            // 这通常不应该发生，因为 authenticate 应该先运行
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden: You do not have permission to perform this action'
            });
        }

        next();
    };
};