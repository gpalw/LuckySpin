// 这个文件 (src/types/index.ts) 用来存放我们共享的 TS 类型

// 对应 'RouletteStatus' 枚举
export type RouletteStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';

// 对应 'Prize' 模型
export interface Prize {
    id: string;
    rouletteId: string;
    weight: number;
    stock: number | null; // 匹配你的 schema: null = No limit
    name: string;
    win_message: string;
    imageUrl: string | null;
    orderIdx: number;
    createdAt: string;
    updatedAt: string;
}

// 对应 'Roulette' 模型
export interface Roulette {
    id: string;
    ownerId: string;
    name: string;
    theme: string | null;
    status: RouletteStatus;
    createdAt: string;
    updatedAt: string;

    // 我们在 Service 里用 'include' 加载了奖品
    prizes: Prize[];
    prizeCount?: number; // 可选的奖品数量计数
}
export interface DrawRecord {
    id: string;
    rouletteId: string;
    prizeId: string | null;
    prizeName: string | null;
    prizeWinMessage: string | null;
    userIdentifier: string | null;
}