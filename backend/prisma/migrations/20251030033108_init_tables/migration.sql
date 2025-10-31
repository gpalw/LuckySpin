/*
  Warnings:

  - You are about to drop the column `win_en` on the `Prize` table. All the data in the column will be lost.
  - You are about to drop the column `win_zh` on the `Prize` table. All the data in the column will be lost.
  - Added the required column `win_message_en` to the `Prize` table without a default value. This is not possible if the table is not empty.
  - Added the required column `win_message_zh` to the `Prize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prize" DROP COLUMN "win_en",
DROP COLUMN "win_zh",
ADD COLUMN     "win_message_en" TEXT NOT NULL,
ADD COLUMN     "win_message_zh" TEXT NOT NULL;
