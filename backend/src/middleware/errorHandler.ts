import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

function isZodError(error: unknown): error is ZodError<any> {
    return error instanceof ZodError;
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error('Request URL:', req.originalUrl);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);

    // 1. Zod 验证错误
    if (isZodError(err)) {
        // zod's ZodError uses `issues` (ZodIssue[]) — not `errors`.
        // Use the `issues` array without importing ZodIssue explicitly.
        // Alternatively you can call `err.flatten()` to get a field -> messages map.
        return res.status(400).json({
            message: 'Validation failed',
            errors:
                err.issues?.map((e) => ({
                    path: e.path?.join('.'),
                    message: e.message,
                })) || 'Unknown validation error',
        });
    }

    // 2. Prisma 已知错误 (例如唯一性约束)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === 'P2002') {
            const target = err.meta?.target as string[];
            return res.status(409).json({
                message: 'Conflict: Unique constraint failed.',
                field: target?.join(', '),
            });
        }
        // Record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                message: err.meta?.cause || 'Resource not found.',
            });
        }
    }

    // 3. JWT 错误
    if (err.name === 'JsonWebTokenError' || err.message === 'Invalid or expired token') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }

    // 4. 自定义的服务逻辑错误
    if (err.message === 'Invalid credentials') {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // 5. 默认 500 错误
    return res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};