import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import type { Prize } from '../types';
import Modal from '../components/Modal';
import { Wheel } from 'react-custom-roulette';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const DEFAULT_SPIN_DURATION_FACTOR = 1.0;
const segmentColors = ['#FDE2E2', '#D1FAE5', '#FEF3C7', '#DBEAFE', '#E5E7EB', '#DDD6FE', '#FEE2E2', '#F0F9FF', '#DCFCE7'];
const KIOSK_DEVICE_ID = "kiosk_browser_001";

const Kiosk = () => {
    const { rouletteId } = useParams();
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // (“便利贴”) 存储上一个中奖的 ID
    const [lastWonPrizeId, setLastWonPrizeId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [winMessage, setWinMessage] = useState({ title: '', message: '' });
    const [rouletteStatus, setRouletteStatus] = useState<string>('LOADING');

    const spinFactor = useMemo(() => {
        const storedFactor = localStorage.getItem('luckySpinFactor');
        // 读取新的 Factor (系数)
        return storedFactor ? parseFloat(storedFactor) : DEFAULT_SPIN_DURATION_FACTOR;
    }, []);

    // 1. 初始化 & 激活会话
    useEffect(() => {
        if (!rouletteId) return;
        const initializeKiosk = async () => {
            try {
                const sessionResponse = await api.post(`/roulettes/${rouletteId}/activate`, {
                    deviceInfo: KIOSK_DEVICE_ID,
                });
                setSessionId(sessionResponse.data.sessionId);
                if (sessionResponse.data.message.includes('not active')) {
                    const rouletteDetails = await api.get(`/roulettes/${rouletteId}`);
                    setRouletteStatus(rouletteDetails.data.status);
                    setError('Event is not active or has been paused. Please contact an administrator.');
                    return;
                }
                setSessionId(sessionResponse.data.sessionId);
                setRouletteStatus('ACTIVE'); // 成功激活
                const prizesResponse = await api.get<Prize[]>(`/roulettes/${rouletteId}/prizes`);
                setPrizes(prizesResponse.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to initialize Kiosk');
            }
        };
        initializeKiosk();
    }, [rouletteId]);

    // 2. (核心) 点击 "开始抽奖"
    const handleSpinClick = async () => {
        if (mustSpin || !rouletteId || !sessionId || prizes.length === 0) return;
        setError(null);

        try {
            const idempotencyKey = generateUUID();
            const drawResponse = await api.post(`/roulettes/${rouletteId}/draw?lang=zh`, {
                deviceInfo: KIOSK_DEVICE_ID,
                idempotencyKey: idempotencyKey,
            });

            // (这是 prizeId 的 *唯一* 声明点)
            const { prizeId, name, message } = drawResponse.data;

            // 检查后端是否返回 "无奖品"
            if (prizeId === "NO_PRIZE") {
                setWinMessage({ title: name, message: message });
                setIsModalOpen(true); // (立即打开弹窗, 告诉用户活动结束)
                setMustSpin(false);
                return; // (停止执行, 不转动)
            }

            // 这是一个 "真" 奖品
            const winningPrizeIndex = prizes.findIndex(p => p.id === prizeId);
            if (winningPrizeIndex === -1) {
                throw new Error("后端返回了一个前端不存在的奖品 ID");
            }

            // 准备好弹窗的文字
            setWinMessage({ title: name, message: message });
            // (核心 "便利贴") 记住这个 ID, 供 handleStopSpinning 使用
            setLastWonPrizeId(prizeId);
            // 告诉转盘要停在哪个索引
            setPrizeNumber(winningPrizeIndex);
            // 开始旋转!
            setMustSpin(true);

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Draw failed');
        }
    };

    // 3. (核心) 当转盘动画停止时
    const handleStopSpinning = () => {
        setMustSpin(false); // 1. 重置旋转状态
        setIsModalOpen(true); // 2. 打开中奖弹窗

        // 3. (核心 "读便利贴") 检查我们 "记住" 的 ID
        if (lastWonPrizeId) {

            // 4. 更新本地库存
            setPrizes((prevPrizes) =>
                prevPrizes.map(p => {
                    if (p.id === lastWonPrizeId) {
                        // (新逻辑: (p.stock || 0) - 1, 确保 null 和 0 都能正确处理)
                        const newStock = Math.max((p.stock || 0) - 1, 0);
                        return { ...p, stock: newStock };
                    }
                    return p;
                })
            );

            // 5. (核心 "擦掉便利贴") 清除 "上一次" 记录
            setLastWonPrizeId(null);
        }

    };

    // 4. 格式化数据, 喂给转盘库
    const wheelData = useMemo(() => {
        return prizes.map((prize, index) => {

            return {
                option: prize.name,
                style: {
                    // 始终使用彩色背景
                    backgroundColor: segmentColors[index % segmentColors.length],
                    // 始终使用深色文字
                    textColor: '#333',
                }
            }
        });
    }, [prizes]); // (当 prizes 数组变化时, 自动重新计算)


    // --- 渲染 (保持不变) ---
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-center text-red-600">Error: {error}</div>;
    }
    if (prizes.length === 0 || wheelData.length === 0) {
        return <div className="flex items-center justify-center min-h-screen text-center text-gray-500">Loading Kiosk...</div>;
    }
    if (rouletteStatus !== 'ACTIVE') {
        const statusText = {
            'DRAFT': 'Event is in draft status and cannot be started.',
            'PAUSED': 'Event is paused. Please contact an administrator to activate it.',
            'ENDED': 'Event has ended and cannot be started.',
            'LOADING': 'Checking event status...',
        }[rouletteStatus] || 'Event status is invalid. Please check.';

        return (
            <div className="flex items-center justify-center min-h-screen bg-red-100 p-8">
                <div className="text-center p-12 bg-white rounded-xl shadow-2xl">
                    <h1 className="text-4xl font-bold text-red-700 mb-4">
                        🛑 Unable to start draw
                    </h1>
                    <p className="text-xl text-gray-700">{statusText}</p>
                    {/* 仅在 LOADING/ERROR 状态下显示 ID */}
                    {error && <p className="text-sm text-gray-500 mt-4">Error details: {error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">

            <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={wheelData}
                onStopSpinning={handleStopSpinning}
                radiusLineWidth={5}
                outerBorderWidth={10}
                outerBorderColor={"#D1D5DB"}
                textDistance={55}
                fontSize={14}
                textOrientation='vertical'
                textAlignment='center'
                spinDuration={spinFactor} // 设置转动比率
            />

            <button
                onClick={handleSpinClick}
                disabled={mustSpin}
                className="mt-12 px-12 py-4 text-2xl font-bold text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
                {mustSpin ? 'Spinning...' : 'Start Draw'}
            </button>

            <Modal
                title={winMessage.title}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <p className="text-lg text-gray-700">{winMessage.message}</p>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Confirm
                    </button>
                </div>
            </Modal>

        </div>
    );
};

export default Kiosk;
