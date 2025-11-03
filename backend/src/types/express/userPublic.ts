import type { Prisma } from '@prisma/client';

// 只选对外需要的字段（按你的 User）
export const userPublicSelect = {
    id: true,
    username: true,
    role: true,
    isActive: true,
    createdAt: true,
} satisfies Prisma.UserSelect;

// 自动推导出与 select 完全匹配的类型
export type UserPublic = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

// 通用返回类型
export type AuthResult = { user: UserPublic; token: string };