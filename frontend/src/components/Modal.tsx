import React from 'react';

// 定义这个组件需要接收哪些 "props" (参数)
interface ModalProps {
    isOpen: boolean;        // 控制弹窗是否显示
    onClose: () => void;      // 点击 "关闭" 按钮或蒙版时调用的函数
    title: string;          // 弹窗的标题
    children: React.ReactNode; // 弹窗的 "内容" (e.g., 中奖信息)
}

/**
 * --- 可重用的弹窗组件 (外壳) ---
 * (Kiosk.tsx 用它来显示中奖结果)
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // 如果 isOpen 是 false, 什么都不渲染 (返回 null)
    if (!isOpen) {
        return null;
    }

    // (阻止点击弹窗内容时, 触发外层 "onClose")
    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        // --- 外层蒙版 (半透明背景) ---
        // (fixed: 铺满全屏; z-50: 确保在最顶层)
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose} // 点击蒙版=关闭
        >
            {/* --- DASHBOARD (白色卡片) --- */}
            <div
                className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-xl"
                onClick={handleModalContentClick}
            >
                {/* 弹窗头部 (标题 + 关闭按钮) */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        {/* "X" 图标 */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* 弹窗主体 (用来放中奖信息) */}
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;