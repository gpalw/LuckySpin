// 这个文件用来扩展 Express 的 Request 类型
import { JwtPayload } from '../../utils/jwt';

declare global {
    namespace Express {
        export interface Request {
            user?: JwtPayload; // 允许 req.user 存在
        }
    }
}