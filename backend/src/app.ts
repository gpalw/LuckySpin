import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';

// 导入路由
import authRoutes from './modules/auth/auth.routes';
import rouletteRoutes from './modules/roulette/roulette.routes';
import prizeRoutes from './modules/prize/prize.routes';
import { exportDrawRecordsController } from './modules/roulette/roulette.controller';
import { authenticate, authorize } from './middleware/authMiddleware';
import { Role } from '@prisma/client';
import userRoutes from './modules/user/user.routes';

// 创建 Express 实例
const app = express();

// --- 核心中间件 ---
app.use(cors()); // 允许所有跨域请求
app.use(helmet()); // 安全头
app.use(express.json()); // JSON 解析
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP 日志

// --- 健康检查路由 ---
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
    });
});

// --- API 路由 ---
// 注意这里的 @/ 别名，它依赖 tsconfig.json 中的 "paths"
app.use('/api/auth', authRoutes); // 挂载 Auth 路由
app.use('/api/roulettes', rouletteRoutes); // 挂载轮盘路由
app.use('/api/prizes', prizeRoutes); // 挂载奖品路由
app.use('/api/users', userRoutes); // 挂载用户管理路由 (仅 Admin)

// --- 404 Not Found (放在所有路由之后) ---
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Resource not found' });
});

// --- 全局错误处理器 (放在最后) ---
app.use(errorHandler);

export default app;