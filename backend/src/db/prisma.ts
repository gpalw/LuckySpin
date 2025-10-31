import { PrismaClient } from '@prisma/client';

// 声明一个全局变量来缓存 PrismaClient
declare global {
    var prisma: PrismaClient | undefined;
}

// 防止在开发环境中 (hot-reloading) 创建多个 PrismaClient 实例
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}