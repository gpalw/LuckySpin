import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api'; // 导入我们创建的 axios 实例

declare global { interface Window { google?: any } }

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // 阻止表单默认提交 (刷新页面)
        setIsLoading(true);
        setError('');

        try {
            // --- (核心) 发送 API 请求到 http://localhost:3001/api/auth/login ---
            const response = await api.post('/auth/login', {
                username,
                password,
            });

            // 登录成功
            if (response.data && response.data.token) {
                // 1. (最重要) 把 token 存到 localStorage
                localStorage.setItem('luckySpinToken', response.data.token);

                // 2. 跳转到后台主页 ('/' 路径)
                navigate('/');
            } else {
                setError('登录失败: 服务器响应无效。');
            }
        } catch (err: any) {
            // 登录失败 (axios 错误)
            if (err.response && err.response.data) {
                // 显示后端返回的错误 (e.g., "Invalid username or password")
                setError(err.response.data.message || '登录失败，请检查用户名或密码。');
            } else {
                // 网络错误或后端没开
                setError(err.message || '发生未知错误 (请确保后端服务器已运行)');
            }
        } finally {
            setIsLoading(false); // 无论成功失败，都结束加载状态
        }
    };

    const handleGoogle = async (credential: string) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/google', { credential }); // 后端从 credential 解析
            if (res.data?.token) {
                localStorage.setItem('luckySpinToken', res.data.token);
                navigate('/');
            } else {
                setError('登录失败：服务器未返回 token');
            }
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Google 登录失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 这是 JSX, 使用 Tailwind v4 的 className
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    LuckySpin - 登录
                </h2>

                {/* 错误提示框, 只有在 error 变量有值时才显示 */}
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700"
                        >
                            用户名
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            密码
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading} // 加载时禁用按钮
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? '登录中...' : '登 录'}
                        </button>
                    </div>
                </form>

                <div className="text-center text-xs text-gray-400">OR</div>
                <div className="flex justify-center">
                    <GoogleSignInButton onCredential={handleGoogle} />
                </div>


            </div>
        </div>
    );
};

function GoogleSignInButton({ onCredential }: { onCredential: (jwt: string) => void }) {
    const btnRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!window.google || !btnRef.current) return;

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID, // .env 里配置
            callback: (resp: any) => {
                // resp.credential 就是 Google ID Token（发给后端 /auth/google）
                onCredential(resp.credential);
            },
            ux_mode: 'popup',
        });

        window.google.accounts.id.renderButton(btnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
        });
    }, []);

    return <div ref={btnRef} />;
}


export default Login;