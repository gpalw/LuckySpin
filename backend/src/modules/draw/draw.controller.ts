import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/prisma';
import { activateSessionSchema, drawSchema } from './draw.validation';
import * as DrawService from './draw.service';

/**
 * POST /api/roulettes/:id/activate
 */
export const activateSessionController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const operatorId = req.user!.id;
        const { deviceInfo } = activateSessionSchema.shape.body.parse(req.body);

        const session = await DrawService.activateSession(rouletteId, operatorId, deviceInfo);

        // 审计日志 (actorId 没问题)
        prisma.auditLog.create({
            data: {
                action: 'ACTIVATE_SESSION',
                payload: { rouletteId, deviceInfo, sessionId: session.id },
                actorId: operatorId,
                rouletteId: rouletteId,
            }
        }).catch(console.error);

        res.status(200).json({
            message: 'Session activated successfully',
            sessionId: session.id,
            rouletteId: session.rouletteId,
        });
    } catch (error) {
        next(error);
    }
};


/**
 * POST /api/roulettes/:id/draw
 */
export const performDrawController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const operatorId = req.user!.id;
        const { idempotencyKey, deviceInfo } = drawSchema.shape.body.parse(req.body);

        const lang = req.query.lang === 'zh' ? 'zh' : 'en';

        const result = await DrawService.performDraw(
            rouletteId,
            operatorId,
            deviceInfo,
            idempotencyKey,
            lang
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};