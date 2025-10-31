-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "RouletteStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roulette" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT,
    "status" "RouletteStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "maxDrawsPerUser" INTEGER,
    "allowRepeatWins" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roulette_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "rouletteId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "stock" INTEGER,
    "name_zh" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "win_zh" TEXT NOT NULL,
    "win_en" TEXT NOT NULL,
    "imageUrl" TEXT,
    "orderIdx" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "rouletteId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "state" "SessionState" NOT NULL DEFAULT 'ACTIVE',
    "deviceInfo" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawRecord" (
    "id" TEXT NOT NULL,
    "rouletteId" TEXT NOT NULL,
    "prizeId" TEXT,
    "userIdentifier" TEXT,
    "ip" TEXT,
    "ua" TEXT,
    "sessionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedRecordId" TEXT,
    "isReversal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DrawRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "rouletteId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Roulette_publicKey_key" ON "Roulette"("publicKey");

-- CreateIndex
CREATE INDEX "Roulette_ownerId_createdAt_idx" ON "Roulette"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Prize_rouletteId_idx" ON "Prize"("rouletteId");

-- CreateIndex
CREATE INDEX "Prize_rouletteId_orderIdx_idx" ON "Prize"("rouletteId", "orderIdx");

-- CreateIndex
CREATE INDEX "Session_rouletteId_idx" ON "Session"("rouletteId");

-- CreateIndex
CREATE INDEX "Session_rouletteId_state_idx" ON "Session"("rouletteId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "DrawRecord_idempotencyKey_key" ON "DrawRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DrawRecord_rouletteId_createdAt_idx" ON "DrawRecord"("rouletteId", "createdAt");

-- CreateIndex
CREATE INDEX "DrawRecord_sessionId_idx" ON "DrawRecord"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_rouletteId_createdAt_idx" ON "AuditLog"("rouletteId", "createdAt");

-- AddForeignKey
ALTER TABLE "Roulette" ADD CONSTRAINT "Roulette_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_rouletteId_fkey" FOREIGN KEY ("rouletteId") REFERENCES "Roulette"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_rouletteId_fkey" FOREIGN KEY ("rouletteId") REFERENCES "Roulette"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawRecord" ADD CONSTRAINT "DrawRecord_rouletteId_fkey" FOREIGN KEY ("rouletteId") REFERENCES "Roulette"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawRecord" ADD CONSTRAINT "DrawRecord_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawRecord" ADD CONSTRAINT "DrawRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_rouletteId_fkey" FOREIGN KEY ("rouletteId") REFERENCES "Roulette"("id") ON DELETE SET NULL ON UPDATE CASCADE;
