import { Router } from 'express';
import { loginController } from './auth.controller';

const router = Router();

// POST /api/auth/login
router.post('/login', loginController);

export default router;