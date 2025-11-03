import { Request, Response, NextFunction } from 'express';
import { loginSchema } from './auth.validation';
import { loginService, loginGoogleService } from './auth.service';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID!);

/**
 * 处理 POST /api/auth/login
 */
export const loginController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. 验证输入 (注意：这里我们用了 .body)
        const { username, password } = loginSchema.shape.body.parse(req.body);

        // 2. 调用服务
        const { user, token } = await loginService(username, password);

        // 3. 响应
        res.status(200).json({
            message: 'Login successful',
            user,
            token,
        });
    } catch (error) {
        // 传递给全局错误处理器
        next(error);
    }
};


/**
 * 处理 POST /api/auth/google
 */
export const loginGoogleController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { credential } = req.body; // 前端传来的 Google ID Token
        if (!credential) return res.status(400).json({ message: 'Missing credential' });

        // 校验 ID Token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) return res.status(401).json({ message: 'Invalid token' });

        // 2. 调用服务
        const { user, token } = await loginGoogleService(payload);

        // 3. 响应
        res.status(200).json({
            message: 'Login successful',
            user,
            token,
        });

    } catch (error) {
        // 传递给全局错误处理器
        next(error);
    }
};