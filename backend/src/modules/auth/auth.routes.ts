import { Router } from 'express';
import { loginController, loginGoogleController } from './auth.controller';


const router = Router();

// POST /api/auth/login
router.post('/login', loginController);

router.post('/google', loginGoogleController);

export default router;