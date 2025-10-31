import { Request, Response, NextFunction } from 'express';
import { loginSchema } from './auth.validation';
import { loginService } from './auth.service';

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