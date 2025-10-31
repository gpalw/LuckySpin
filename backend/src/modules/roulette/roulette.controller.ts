import { Request, Response, NextFunction } from 'express';
import * as RouletteService from './roulette.service';
import { prisma } from '../../db/prisma';
import { createRouletteSchema, updateRouletteStatusSchema } from './roulette.validation';
import { toCsv } from '../../utils/csv';

// GET /api/roulettes
export const getAllRoulettesController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const roulettes = await RouletteService.getAllRoulettes();
        res.status(200).json(roulettes);
    } catch (error) {
        next(error);
    }
};

// POST /api/roulettes
export const createRouletteController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. 验证输入
        const { name, theme } = createRouletteSchema.shape.body.parse(req.body);

        // 2. 获创建者 ID (来自 authMiddleware)
        // req.user! (感叹号) 表示我们断言 req.user 此时一定存在
        const ownerId = req.user!.id;

        // 3. 调用服务
        const newRoulette = await RouletteService.createRoulette({ name, theme }, ownerId);

        // 4. 记录审计日志 (异步)
        prisma.auditLog.create({
            data: {
                action: 'CREATE_ROULETTE',
                payload: newRoulette,
                actorId: ownerId,
                rouletteId: newRoulette.id
            }
        }).catch(console.error);

        res.status(201).json(newRoulette);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/roulettes/:id
 */
export const getRouletteByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const roulette = await RouletteService.getRouletteById(rouletteId);
        res.status(200).json(roulette);
    } catch (error) {
        // (如果 findUnique 没找到, service 会抛错, 我们在这里捕获)
        // (我们的 errorHandler 会处理 "Roulette not found" 并返回 404)
        next(error);
    }
};

// PATCH /api/roulettes/:id/status
export const updateRouletteStatusController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 验证 ID (假设是 Int)
        const rouletteId = req.params.id;

        // 验证 Body
        const { status } = updateRouletteStatusSchema.shape.body.parse(req.body);

        const updatedRoulette = await RouletteService.updateRouletteStatus(rouletteId, status);

        // 记录日志
        prisma.auditLog.create({
            data: {
                action: `UPDATE_ROULETTE_STATUS: ${status}`,
                payload: { from: updatedRoulette.status, to: status },
                actorId: req.user!.id,
                rouletteId: updatedRoulette.id
            }
        }).catch(console.error);

        res.status(200).json(updatedRoulette);
    } catch (error) {
        next(error);
    }
};

/**
 * --- (这是新函数) ---
 * DELETE /api/roulettes/:id
 */
export const deleteRouletteController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const actorId = req.user!.id; // (获取操作人 ID)

        await RouletteService.deleteRoulette(rouletteId, actorId);

        // (记录日志 - 注意: 轮盘已删, 所以不传 rouletteId)
        prisma.auditLog.create({
            data: {
                action: 'DELETE_ROULETTE',
                payload: { rouletteId: rouletteId },
                actorId: actorId,
            }
        }).catch(console.error);

        // 204: No Content (成功, 但没有内容返回)
        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/records/export
 * 导出所有抽奖记录 (作为管理员功能)
 */
export const exportDrawRecordsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const rouletteId = req.params.id;
        const roulette = await prisma.roulette.findUnique({
            where: { id: rouletteId },
            select: { name: true } // 只需要名称
        });

        if (!roulette) {
            return res.status(404).json({ message: "Roulette not found." });
        }
        const rouletteName = roulette.name;

        // 1. 从数据库获取所有记录
        const records = await prisma.drawRecord.findMany({
            where: { rouletteId: rouletteId }, // <-- 关键筛选条件
            orderBy: { createdAt: 'desc' }
        });

        // 2. 转换为 CSV
        const csvContent = toCsv(records, rouletteName);

        // 3. 设置 HTTP 头并发送
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=roulette_${rouletteId}_draw_records_${new Date().toISOString()}.csv`);
        res.status(200).send(csvContent);

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/roulettes
 * 获取轮盘列表 (现在加入了权限控制)
 */
export const getRoulettesController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. 从认证中间件 (authMiddleware) 注入的 req.user 中安全地获取用户 ID 和 Role
        const actorId = req.user!.id;
        const actorRole = req.user!.role;

        // 2. 调用服务层，传入用户身份信息进行数据筛选
        const roulettes = await RouletteService.getRoulettesService(actorId, actorRole);

        res.json(roulettes);
    } catch (error) {
        next(error);
    }
};