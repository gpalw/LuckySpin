import { Request, Response, NextFunction } from 'express';
import * as PrizeService from './prize.service';
import { prisma } from '../../db/prisma';
import { createPrizeSchema, updatePrizeSchema, updatePrizeStockSchema } from './prize.validation';

// POST /api/roulettes/:id/prizes (这个控制器会被 roulette.routes.ts 调用)
export const addPrizeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id; // 从 URL 获取轮盘 ID
        const prizeData = createPrizeSchema.shape.body.parse(req.body);

        const newPrize = await PrizeService.addPrizeToRoulette(rouletteId, prizeData);

        // 审计日志 (异步)
        prisma.auditLog.create({
            data: {
                action: 'ADD_PRIZE',
                payload: newPrize,
                actorId: req.user!.id,
                rouletteId: rouletteId,
            }
        }).catch(console.error);

        res.status(201).json(newPrize);
    } catch (error) {
        next(error);
    }
};

// GET /api/roulettes/:id/prizes (这个控制器也会被 roulette.routes.ts 调用)
export const getPrizesController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const prizes = await PrizeService.getPrizesForRoulette(rouletteId);
        res.status(200).json(prizes);
    } catch (error) {
        next(error);
    }
};


// PATCH /api/prizes/:prizeId (这个控制器会被 prize.routes.ts 调用)
export const updatePrizeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const prizeId = req.params.id;

        if (!prizeId) {
            return res.status(400).json({ message: 'Prize ID is missing' });
        }
        // 我们使用 partial() 来允许只更新部分字段
        const prizeData = updatePrizeSchema.parse(req.body);

        const updatedPrize = await PrizeService.updatePrize(prizeId, prizeData);

        // 审计日志
        prisma.auditLog.create({
            data: {
                action: 'UPDATE_PRIZE',
                payload: { prizeId, changes: prizeData },
                actorId: req.user!.id,
                rouletteId: updatedPrize.rouletteId, // 关联到轮盘
            }
        }).catch(console.error);

        res.status(200).json(updatedPrize);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/prizes/:prizeId/stock (我们 spec 上的特定路由)
export const updatePrizeStockController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const prizeId = req.params.id; // 注意 URL 可能是 :id
        const { stock } = updatePrizeStockSchema.shape.body.parse(req.body);

        const updatedPrize = await PrizeService.updatePrize(prizeId, { stock });

        // 审计日志
        prisma.auditLog.create({
            data: {
                action: 'UPDATE_STOCK',
                payload: { prizeId, newStock: stock },
                actorId: req.user!.id,
                rouletteId: updatedPrize.rouletteId,
            }
        }).catch(console.error);

        res.status(200).json(updatedPrize);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/prizes/:id
 */
export const deletePrizeController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const prizeId = req.params.id; // (注意: 路由里是 :id)

        // (调用我们早已写好的 prize.service.ts 里的 deletePrize)
        const deletedPrize = await PrizeService.deletePrize(prizeId);

        // 审计日志
        prisma.auditLog.create({
            data: {
                action: 'DELETE_PRIZE',
                payload: deletedPrize,
                actorId: req.user!.id,
                rouletteId: deletedPrize.rouletteId,
            }
        }).catch(console.error);

        // 204: No Content (成功, 但没有内容返回)
        res.status(204).send();

    } catch (error) {
        next(error);
    }
};