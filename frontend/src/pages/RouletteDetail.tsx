import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api'; // 1. 导入 api
import type { Roulette, Prize, RouletteStatus } from '../types'; // 导入 Roulette (它也包含了 Prize)
import Modal from '../components/Modal'; // 导入 Modal
import CreatePrizeForm from '../components/CreatePrizeForm'; // 导入新表单
import EditPrizeForm from '../components/EditPrizeForm';

const DEFAULT_SPIN_DURATION_FACTOR = 1;

/**
 * --- 轮盘详情/管理页面 ---
 */
const RouletteDetail = () => {
    const { id } = useParams(); // 3. 从 URL 读取 ID
    const navigate = useNavigate(); // (用于删除后跳转)


    // --- State ---
    const [roulette, setRoulette] = useState<Roulette | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // (控制 "添加奖品" 弹窗的状态)
    const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
    // (我们用一个新 state, 避免在用户点击 "保存" 前就意外更改了数据)
    const [selectedStatus, setSelectedStatus] = useState<RouletteStatus>('DRAFT');
    const [isSaving, setIsSaving] = useState(false); // 保存按钮的加载状态
    // (如果它是 null, "编辑" 弹窗就关闭; 如果它是一个 Prize, 弹窗就打开)
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const [spinFactor, setSpinFactor] = useState(DEFAULT_SPIN_DURATION_FACTOR);
    const [isExporting, setIsExporting] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        // 4. (核心) 加载数据
        if (!id) {
            setError('No Roulette ID provided');
            setIsLoading(false);
            return;
        }

        const storedFactor = localStorage.getItem('luckySpinFactor');
        if (storedFactor) {
            setSpinFactor(parseFloat(storedFactor));
        }
        const fetchRoulette = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 调用我们的后端接口
                const response = await api.get<Roulette>(`/roulettes/${id}`);
                // 存储数据
                setRoulette(response.data);
                // 当数据加载后, 设置下拉框的 "初始值"
                setSelectedStatus(response.data.status);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Load failed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoulette();
    }, [id]); // (当 ID 变化时, 重新加载)

    /**
   * (回调函数)
   * 当 CreatePrizeForm "交还" 新奖品时,
   * 我们把它添加到现有列表 (roulette.prizes) 的末尾
   */
    const handlePrizeCreated = (newPrize: Prize) => {
        if (!roulette) return; // (安全检查)

        // (更新 state, 把新奖品加到数组里)
        setRoulette({
            ...roulette,
            prizes: [...(roulette.prizes || []), newPrize],
        });
    };

    // (Update)
    const handlePrizeUpdated = (updatedPrize: Prize) => {
        if (!roulette) return;
        // (遍历 "prizes" 数组, 找到 ID 匹配的, 替换成 "updatedPrize")
        setRoulette(prev => ({
            ...prev!,
            prizes: prev!.prizes.map(p =>
                p.id === updatedPrize.id ? updatedPrize : p
            ),
        }));
    };

    // (Delete)
    const handlePrizeDeleted = (deletedPrizeId: string) => {
        if (!roulette) return;
        // (遍历 "prizes" 数组, "过滤" 掉 ID 匹配的)
        setRoulette(prev => ({
            ...prev!,
            prizes: prev!.prizes.filter(p => p.id !== deletedPrizeId),
        }));
    };

    // ---计算总权重 ---
    const totalWeight = useMemo(() => {
        // (使用可选链 ?. 和 || 0 来确保它永不崩溃)
        return roulette?.prizes?.reduce((sum, prize) => sum + prize.weight, 0) || 0;
    }, [roulette]);

    /**
   * 点击 "保存更改" 按钮时
   */
    const handleStatusSave = async () => {
        if (!id) return;
        setIsSaving(true);
        setError(null);

        try {
            // (调用我们早已写好的后端接口)
            const response = await api.patch<Roulette>(`/roulettes/${id}/status`, {
                status: selectedStatus,
            });

            // (成功)
            // 1. 更新页面上的 "主" roulette state
            setRoulette(response.data);
            alert('Status updated successfully!');

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * (Delete)
     * 7. 点击 "删除这个轮盘" 按钮时
     */
    const handleDelete = async () => {
        if (!id) return;

        // (给用户一个 "反悔" 的机会)
        const isConfirmed = window.confirm(
            `Are you sure you want to permanently delete "${roulette?.name}"?\nThis action cannot be undone.`
        );

        if (!isConfirmed) {
            return; // 用户点击了 "取消"
        }

        setIsSaving(true); // (复用 "isSaving" 状态来禁用所有按钮)
        setError(null);

        try {
            // (我们还没有为 "删除" 写后端接口, 但我们先写前端)
            // (假设后端接口是: DELETE /api/roulettes/:id)

            // --- 去后端添加 DELETE 接口 ---
            await api.delete(`/roulettes/${id}`);

            alert('Roulette deleted successfully!');

            // (删除成功后, 跳转回列表页)
            navigate('/');

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Delete failed');
            setIsSaving(false);
        }
    };

    // ---  "启动 Kiosk" 函数   ---
    const handleLaunchKiosk = () => {
        if (roulette?.status !== 'ACTIVE') {
            alert('Launch failed: roulette must be in "ACTIVE" status to start.');
            return;
        }
        if (!roulette.id) return;

        // (在新标签页中打开 Kiosk 页面)
        window.open(`/kiosk/${roulette.id}`, '_blank');
    };

    /**
 * --- (新增函数) 快速调整库存 (+1 或 -1) ---
 */
    const handleQuickStockUpdate = async (prizeId: string, delta: 1 | -1) => {
        if (!roulette) return;

        const originalPrizes = roulette.prizes;

        // 1. 乐观更新 (Frontend Optimistic Update): 先在前端改，让用户觉得很快
        const updatedPrizes = roulette.prizes.map(p => {
            if (p.id === prizeId) {
                // 确保库存不低于 0
                const newStock = Math.max((p.stock || 0) + delta, 0);
                return { ...p, stock: newStock };
            }
            return p;
        });
        setRoulette({ ...roulette, prizes: updatedPrizes });

        // 2. 后端同步
        const prizeToUpdate = updatedPrizes.find(p => p.id === prizeId);
        if (!prizeToUpdate) return;

        // 3. 跟踪当前操作状态，避免并发冲突
        const currentStock = prizeToUpdate.stock;

        try {
            // 调用我们早已写好的 PATCH /api/prizes/:id/stock 接口
            await api.patch(`/prizes/${prizeId}/stock`, { stock: currentStock });
        } catch (error) {
            // 4. (悲观回滚) 如果后端失败了，必须回滚前端状态
            alert('Stock sync failed, rolled back to original state. Please check stock or network.');
            setRoulette({ ...roulette, prizes: originalPrizes }); // 回滚到原始状态
        }
    };

    const handleFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Range Slider 的值是字符串，我们转成浮点数
        const factor = parseFloat(e.target.value);
        setSpinFactor(factor);
        // 3. (核心) 立即保存到 LocalStorage
        localStorage.setItem('luckySpinFactor', factor.toFixed(2));
    };

    const handleExport = async () => {
        if (!roulette?.id) return;

        setIsExporting(true);
        try {
            // 1. 使用 axios 发送请求，并要求返回 blob (二进制数据)
            const response = await api.get(`/roulettes/${roulette.id}/export`, {
                responseType: 'blob',
            });

            // 2. 从 HTTP 头中获取文件名 (Content-Disposition)
            const disposition = response.headers['content-disposition'];
            let filename = `export_records_${roulette.id}.csv`; // 默认文件名
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameMatch = disposition.match(/filename="([^"]*)"/);
                if (filenameMatch?.[1]) {
                    filename = filenameMatch[1];
                }
            }

            // 3. 创建一个临时的 URL 和 <a> 标签来触发下载
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            alert('Export failed: Unable to download file. Please make sure you have admin permission.');
            console.error('Export Error:', error);
        } finally {
            setIsExporting(false);
        }
    };


    // --- Render ---

    // 7. 处理加载和错误状态
    if (isLoading) {
        return <div className="p-8">Loading roulette info...</div>;
    }
    if (error) {
        return (
            <div className="p-8 text-red-600">
                <p>Error: {error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-blue-600">
                    Click here to retry
                </button>
            </div>
        );
    }
    if (!roulette) {
        return <div className="p-8">Roulette not found.</div>;
    }
    const prizes = roulette.prizes || [];
    // 8. (核心) 成功渲染
    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶栏 (和 Dashboard 一样) */}
            <header className="bg-white shadow-sm">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        &larr; Back to roulette list
                    </Link>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">
                        {roulette.name}
                    </h1>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* 左侧: 奖品列表 */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Prize List (Total Weight: {totalWeight})</h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {prizes.length === 0 && (
                                <li className="p-4 text-center text-gray-500">
                                    This roulette has no prizes yet.
                                </li>
                            )}
                            {/* --- 奖品列表渲染 --- */}
                            {prizes.map((prize) => {
                                // (实时计算每个奖品的百分比)
                                const probability = totalWeight > 0 ? (prize.weight / totalWeight) * 100 : 0;

                                return (
                                    <li key={prize.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{prize.name}</p>
                                            <p className="text-sm text-gray-600">
                                                Stock: {prize.stock === null ? 'Unlimited' : prize.stock} |
                                                Weight: {prize.weight}
                                                {/* (显示百分比) */}
                                                {prize.weight > 0 && (
                                                    <span className="ml-2 font-medium text-blue-600">
                                                        ( {probability.toFixed(2)}% )
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleQuickStockUpdate(prize.id, -1)}
                                                disabled={isSaving || (prize.stock || 0) <= 0}
                                                className="px-2 py-1 text-sm font-bold text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                                            >
                                                -1
                                            </button>
                                            <button
                                                onClick={() => handleQuickStockUpdate(prize.id, 1)}
                                                disabled={isSaving}
                                                className="px-2 py-1 text-sm font-bold text-green-600 border border-green-300 rounded-md hover:bg-green-50"
                                            >
                                                +1
                                            </button>
                                            <button
                                                onClick={() => setEditingPrize(prize)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <button
                        onClick={() => setIsPrizeModalOpen(true)}
                        className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        + Add New Prize
                    </button>
                </div>

                {/* 右侧: 轮盘设置 */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-semibold mb-4">Roulette Settings</h2>
                    <div className="bg-white shadow rounded-lg p-6 space-y-4">
                        <div>
                            <label htmlFor="spin-factor" className="block text-sm font-medium text-gray-700">
                                Spin Speed Multiplier: {Math.round(spinFactor * 100)}%
                            </label>
                            <input
                                id="spin-factor"
                                type="range"
                                min="0.5"   // 快速 (50% 耗时)
                                max="2.0"   // 慢速 (200% 耗时)
                                step="0.1"
                                value={spinFactor}
                                onChange={handleFactorChange}
                                className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500 mt-1 flex justify-between">
                                <span>Fast (50% duration)</span>
                                <span>Slow (200% duration)</span>
                            </p>
                        </div>
                        {/* ---  ↓↓↓  (核心) 新增 "启动 Kiosk" 按钮  ↓↓↓  --- */}
                        <div>
                            <button
                                onClick={handleLaunchKiosk}
                                disabled={isSaving}
                                className="w-full px-4 py-3 text-lg font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                            >
                                🚀 Launch Kiosk Mode
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                (This will open the spin wheel in a new tab)
                            </p>
                        </div>

                        {/* 数据导出 */}
                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Data Export</h3>
                            <button
                                // ---  ↓↓↓  使用 button 触发 handleExport  ↓↓↓  ---
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full text-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-400"
                            >
                                {isExporting ? 'Exporting...' : 'Download Draw Records (CSV)'}
                            </button>
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Roulette Status
                            </label>
                            <select
                                id="status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as RouletteStatus)} // (更新 "新" state)
                                disabled={isSaving} // (正在保存或删除时禁用)
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="DRAFT">Draft (DRAFT)</option>
                                <option value="ACTIVE">Active (ACTIVE)</option>
                                <option value="PAUSED">Paused (PAUSED)</option>
                                <option value="ENDED">Ended (ENDED)</option>
                                <option value="ARCHIVED">Archived (ARCHIVED)</option>
                            </select>
                        </div>

                        {/* 保存按钮 */}
                        <div>
                            <button
                                onClick={handleStatusSave}
                                disabled={isSaving} // "保存中", 则禁用)
                                className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {/* 删除按钮 */}
                        <div className="pt-4 border-t">
                            <button
                                onClick={handleDelete}
                                disabled={isSaving} // (正在保存或删除时禁用)
                                className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                            >
                                Delete this roulette
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- 添加奖品的弹窗 --- */}
            <Modal
                title="Add New Prize"
                isOpen={isPrizeModalOpen}
                onClose={() => setIsPrizeModalOpen(false)}
            >
                <CreatePrizeForm
                    rouletteId={roulette.id}
                    onClose={() => setIsPrizeModalOpen(false)}
                    onPrizeCreated={handlePrizeCreated}
                    currentTotalWeight={totalWeight} // (把总权重传给表单)
                />
            </Modal>

            {/* ---  "编辑" 奖品的弹窗   --- */}
            {/* (只有当 editingPrize 不是 null 时, isOpen 才是 true) */}
            <Modal
                title="Edit Prize"
                isOpen={!!editingPrize}
                onClose={() => setEditingPrize(null)} // (关闭 = 设为 null)
            >
                {/* (确保 editingPrize 存在时才渲染表单) */}
                {editingPrize && (
                    <EditPrizeForm
                        prize={editingPrize} // (把要编辑的奖品传给表单)
                        onClose={() => setEditingPrize(null)}
                        onPrizeUpdated={handlePrizeUpdated}
                        onPrizeDeleted={handlePrizeDeleted}
                    />
                )}
            </Modal>
        </div>
    );
};

export default RouletteDetail;