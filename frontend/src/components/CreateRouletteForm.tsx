import React, { useState } from 'react';
import api from '../lib/api';
import type { Roulette } from '../types'; // 导入我们的类型

// 定义这个组件需要接收哪些 props
interface CreateRouletteFormProps {
    onClose: () => void; // 用于在创建成功后, 通知父组件(Dashboard)关闭弹窗
    onRouletteCreated: (newRoulette: Roulette) => void; // (核心) 将新创建的轮盘 "交还" 给父组件
}

const CreateRouletteForm: React.FC<CreateRouletteFormProps> = ({ onClose, onRouletteCreated }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // (核心) 发送 POST 请求到 /api/roulettes
            const response = await api.post<Roulette>('/roulettes', {
                name: name,
                // (theme 是可选的, 后端会自动给 'default')
            });

            // --- 成功 ---
            // 1. (核心) 调用 "回调函数", 把新轮盘 (response.data) 交给 Dashboard
            onRouletteCreated(response.data);
            // 2. 关闭弹窗
            onClose();

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || '创建失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* 错误提示 */}
            {error && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                    {error}
                </div>
            )}

            {/* 表单输入 */}
            <div>
                <label htmlFor="rouletteName" className="block text-sm font-medium text-gray-700">
                    轮盘名称
                </label>
                <input
                    id="rouletteName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="例如: '周年庆典'"
                    className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* 底部按钮 (取消 + 提交) */}
            <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                    type="button" // (type="button" 避免触发表单提交)
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    取消
                </button>
                <button
                    type="submit"
                    disabled={isLoading || !name} // 如果正在加载或名称为空，则禁用
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? '创建中...' : '创建'}
                </button>
            </div>
        </form>
    );
};

export default CreateRouletteForm;