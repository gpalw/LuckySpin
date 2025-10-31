"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// 密码哈希的 salt rounds
const SALT_ROUNDS = 10;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const checkEnvVars = () => {
    if (!ADMIN_USERNAME) {
        throw new Error("CRITICAL: ADMIN_USERNAME environment variable is missing. Cannot run seed.");
    }
    if (!ADMIN_PASSWORD) {
        throw new Error("CRITICAL: ADMIN_PASSWORD environment variable is missing. Cannot run seed.");
    }
    if (ADMIN_PASSWORD.length < 8) {
        console.warn("⚠️ WARNING: ADMIN_PASSWORD is very short. Consider using a stronger password.");
    }
};
async function main() {
    console.log('Start seeding ...');
    checkEnvVars();
    // 1. 创建 Admin 账号
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const adminUser = await prisma.user.upsert({
        where: { username: ADMIN_USERNAME },
        update: {
            passwordHash: adminPasswordHash,
            role: client_1.Role.ADMIN,
        },
        create: {
            username: ADMIN_USERNAME,
            passwordHash: adminPasswordHash,
            role: client_1.Role.ADMIN,
        },
    });
    console.log(`Created admin user: ${adminUser.username}`);
    // 2. 创建一个示例轮盘
    const demoRoulette = await prisma.roulette.create({
        data: {
            name: '周年庆典轮盘 (Demo)',
            theme: 'default',
            status: 'DRAFT',
            owner: {
                connect: {
                    id: adminUser.id,
                },
            },
            // 嵌套创建奖品
            prizes: {
                create: [
                    {
                        name: 'First Prize: Game Console',
                        win_message: 'Congrats! You won a Game Console!',
                        stock: 3,
                        weight: 1,
                    },
                    {
                        name: 'Second Prize: Bluetooth Earbuds',
                        win_message: 'Congrats! You won Bluetooth Earbuds!',
                        stock: 10,
                        weight: 10,
                    },
                    {
                        name: 'Third Prize: T-Shirt',
                        win_message: 'Congrats! You won a T-Shirt!',
                        stock: 30,
                        weight: 30,
                    },
                    {
                        name: 'Thanks for playing',
                        win_message: 'Sorry, better luck next time!',
                        stock: 9999,
                        weight: 100,
                    },
                ],
            },
        },
        // 包含奖品信息返回
        include: {
            prizes: true,
        },
    });
    console.log(`Created demo roulette: ${demoRoulette.name}`);
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    // 关闭 Prisma 客户端连接
    await prisma.$disconnect();
});
