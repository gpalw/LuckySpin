import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import {
    getAllRoulettesController,
    createRouletteController,
    updateRouletteStatusController,
    getRouletteByIdController,
    deleteRouletteController,
    getRoulettesController,
    exportDrawRecordsController
} from './roulette.controller';

import {
    addPrizeController,
    getPrizesController
} from '../prize/prize.controller';

import {
    activateSessionController,
    performDrawController
} from '../draw/draw.controller';

const router = Router();

// 定义管理员角色
const isAdmin = authorize([Role.ADMIN]);
// 定义操作员或管理员
const isOperatorOrAdmin = authorize([Role.ADMIN, Role.OPERATOR]);

// --- 轮盘管理 (Admin 权限) ---

// GET /api/roulettes
// 获取所有轮盘
// (我们允许 'ADMIN' 和 'OPERATOR' 都能看列表)
router.get(
    '/',
    authenticate,
    isOperatorOrAdmin,
    getRoulettesController
);

// POST /api/roulettes
// 创建新轮盘 (仅限 Admin)
router.post(
    '/',
    authenticate,
    isOperatorOrAdmin,
    createRouletteController
);

// PATCH /api/roulettes/:id/status
// 更新轮盘状态 (e.g., 激活, 暂停) (仅限 Admin)
router.patch(
    '/:id/status',
    authenticate,
    isOperatorOrAdmin,
    updateRouletteStatusController
);

// GET /api/roulettes/:id/prizes
// 获取指定轮盘下的所有奖品
router.get(
    '/:id/prizes',
    authenticate,
    isOperatorOrAdmin, // Admin 和 Operator 都能看奖品
    getPrizesController
);

// POST /api/roulettes/:id/prizes
// 为指定轮盘添加新奖品
router.post(
    '/:id/prizes',
    authenticate,
    isOperatorOrAdmin, // 仅限 Admin
    addPrizeController
);


// POST /api/roulettes/:id/activate
// 激活轮盘，锁定设备
router.post(
    '/:id/activate',
    authenticate,
    isOperatorOrAdmin, // Admin 和 Operator 都能激活
    activateSessionController
);

// POST /api/roulettes/:id/draw
// 执行抽奖
router.post(
    '/:id/draw',
    authenticate,
    isOperatorOrAdmin, // Admin 和 Operator 都能抽奖
    performDrawController
);

router.get(
    '/:id',
    authenticate,
    isOperatorOrAdmin, // Admin 和 Operator 都能看详情
    getRouletteByIdController
);

// DELETE /api/roulettes/:id (删除轮盘)
router.delete(
    '/:id',
    authenticate,
    isOperatorOrAdmin, // (必须是 Admin 才能删除)
    deleteRouletteController
);

router.get(
    '/:id/export',
    authenticate,
    isAdmin, // 仅管理员可导出
    exportDrawRecordsController
);

export default router;