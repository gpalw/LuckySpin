// backend/src/modules/user/user.routes.ts
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { createUserController } from './user.controller';

const router = Router();
const isAdmin = authorize([Role.ADMIN]);

// POST /api/users (Admin Only)
router.post('/', authenticate, isAdmin, createUserController);

export default router;