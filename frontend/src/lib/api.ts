import axios, { type InternalAxiosRequestConfig } from 'axios';

// 你的后端 API (确保它正在运行)
const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

/**
 * --- 请求拦截器 ---
 * 在 *每次* 前端发送请求 (e.g., GET /api/roulettes) 之前,
 * 此函数会自动从 localStorage 读取 token, 并把它加到 'Authorization' 请求头里。
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('luckySpinToken');
        if (token) {
            // Merge headers in a safe way. Cast headers to a simple Record so we can
            // spread them; then cast back to any because axios uses a complex
            // AxiosHeaders structure internally.
            const existing = config.headers as Record<string, string> | undefined;
            config.headers = ({ ...(existing ?? {}), Authorization: `Bearer ${token}` } as any);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * --- 响应拦截器 ---
 * 在后端返回响应后执行。
 * 主要用于处理全局错误, e.g., 如果 Token 失效 (401), 自动T人回登录页
 */
api.interceptors.response.use(
    (response) => response, // 成功的响应直接返回
    (error) => {
        const isLoginOrUserCreation = error.config.url.includes('/auth/login') || error.config.url.includes('/users');
        // 检查是否是 401 (未授权) 或 403 (禁止) 错误
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            if (isLoginOrUserCreation) {
                return Promise.reject(error);
            }
            if (status === 401) {
                localStorage.removeItem('luckySpinToken');
                alert('Your login has expired, please log in again.');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (status === 403) {
                // 不清除 Token，不强制跳转。只弹窗提示权限不足。
                alert('Permission denied: You do not have access to perform this action.');
                return Promise.reject(error);
            }
        }
        // 将错误继续抛出，以便组件中的 .catch() 也能处理
        return Promise.reject(error);
    }
);

export default api;