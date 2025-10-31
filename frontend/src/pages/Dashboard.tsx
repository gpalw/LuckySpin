import React, { useState, useEffect } from 'react';
import api from '../lib/api'; // 我们的 axios 实例
import type { Roulette } from '../types'; // 导入我们刚创建的类型
import Modal from '../components/Modal'; // 导入弹窗外壳
import CreateRouletteForm from '../components/CreateRouletteForm'; // 导入表单
import { Link } from 'react-router-dom';

// (临时) 退出登录函数
const handleLogout = () => {
    localStorage.removeItem('luckySpinToken');
    window.location.href = '/login'; // 刷新跳转
};

/**
 * --- 后台管理主页 ---
 */
const Dashboard = () => {
    // --- State ---
    // 存储轮盘列表
    const [roulettes, setRoulettes] = useState<Roulette[]>([]);
    // 存储加载状态
    const [isLoading, setIsLoading] = useState(true);
    // 存储错误信息
    const [error, setError] = useState<string | null>(null);
    // 新增一个 state, 用于控制“新建轮盘”弹窗的显示/隐藏
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Data Fetching ---
    // (useEffect: 在组件第一次加载时, 运行一次)
    useEffect(() => {
        const fetchRoulettes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // (核心) 发送 API 请求
                // 我们的 api.ts 拦截器会自动附加 token
                const response = await api.get<Roulette[]>('/roulettes');

                setRoulettes(response.data); // 存储数据

            } catch (err: any) {
                // (api.ts 拦截器会处理 401/403)
                // 这里只处理其他错误, e.g., 500
                setError(err.message || '无法获取轮盘列表');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoulettes(); // 执行函数
    }, []); // 空依赖数组 [], 确保只运行一次

    /**
   * (回调函数)
   * 当 CreateRouletteForm "交还" 新轮盘时,
   * 我们把它添加到现有列表 (roulettes) 的最前面
   */
    const handleRouletteCreated = (newRoulette: Roulette) => {
        // (使用函数式更新, 保证拿到最新的 state)
        setRoulettes((prevRoulettes) => [newRoulette, ...prevRoulettes]);
    };


    // --- Render (渲染) ---

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶栏 */}
            <header className="bg-white shadow-sm">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        LuckySpin - 管理后台
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        退出登录
                    </button>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">轮盘列表</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        + 新建轮盘
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {/* 1. 加载中... */}
                    {isLoading && (
                        <div className="p-12 text-center text-gray-500">
                            正在加载...
                        </div>
                    )}

                    {/* 2. 出错了... */}
                    {error && (
                        <div className="p-12 text-center text-red-600">
                            加载失败: {error}
                        </div>
                    )}

                    {/* 3. 成功, 但列表为空 */}
                    {!isLoading && !error && roulettes.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            没有找到轮盘。请点击 "新建轮盘"
                            来创建一个。
                        </div>
                    )}

                    {/* 4. 成功, 渲染列表 */}
                    {!isLoading && !error && roulettes.length > 0 && (
                        <ul className="divide-y divide-gray-200">
                            {roulettes.map((roulette) => (
                                <li key={roulette.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <span
                                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${roulette.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                roulette.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {roulette.status}
                                        </span>
                                        <p className="mt-2 text-lg font-semibold text-gray-900">{roulette.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {roulette.prizeCount} 种奖品 |
                                            ID: {roulette.id}
                                        </p>
                                    </div>
                                    <div>
                                        <Link
                                            to={`/roulette/${roulette.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            管理
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            {/* --- 新建轮盘的弹窗 --- */}
            <Modal
                title="新建轮盘"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                {/* 我们把 "表单" 作为 "内容" (children) 传给 Modal */}
                <CreateRouletteForm
                    onClose={() => setIsModalOpen(false)}
                    onRouletteCreated={handleRouletteCreated}
                />
            </Modal>

        </div>
    );
};

export default Dashboard;