// backend/src/modules/user/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/prisma';
import * as UserService from './user.service';
import { createUserSchema } from './user.validation';
import { Role } from '@prisma/client';

/**
 * POST /api/users
 * 创建新用户 (Admin Only)
 */
export const createUserController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username, password, role } = createUserSchema.shape.body.parse(req.body);
        const actorId = req.user!.id; // 当前操作的管理员 ID

        const newUser = await UserService.createUserService(username, password, role);

        // 记录审计日志
        prisma.auditLog.create({
            data: {
                action: `CREATE_USER_${role}`,
                payload: { username: newUser.username },
                actorId: actorId,
            }
        }).catch(console.error);

        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};