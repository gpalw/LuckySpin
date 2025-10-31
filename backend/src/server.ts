import 'dotenv/config'; // 确保环境变量在最开始加载
import app from './app';

const PORT = process.env.PORT || 3001;

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});