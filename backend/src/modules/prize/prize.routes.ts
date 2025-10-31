import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { updatePrizeStockController, updatePrizeController, deletePrizeController } from './prize.controller';

const router = Router();
const isAdmin = authorize([Role.ADMIN]);

// --- 奖品管理 (Admin 权限) ---

// 我们的 Spec 要求: PATCH /api/prizes/:id/stock
// 注意: 我们用 :id 匹配 spec
router.patch(
    '/:id/stock',
    authenticate,
    isAdmin,
    updatePrizeStockController
);

// (可选) 提供一个更通用的更新端点
router.patch(
    '/:id',
    authenticate,
    isAdmin,
    updatePrizeController
);

router.delete(
    '/:id',
    authenticate,
    isAdmin,
    deletePrizeController
);

export default router;