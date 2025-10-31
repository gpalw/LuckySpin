/*
Warnings:

- You are about to drop the column `name_en` on the `Prize` table. All the data in the column will be lost.
- You are about to drop the column `name_zh` on the `Prize` table. All the data in the column will be lost.
- You are about to drop the column `win_message_en` on the `Prize` table. All the data in the column will be lost.
- You are about to drop the column `win_message_zh` on the `Prize` table. All the data in the column will be lost.
- Added the required column `name` to the `Prize` table without a default value. This is not possible if the table is not empty.
- Added the required column `win_message` to the `Prize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prize" RENAME COLUMN "name_zh" TO "name";

ALTER TABLE "Prize" RENAME COLUMN "win_message_zh" TO "win_message";

ALTER TABLE "Prize" DROP COLUMN "name_en";

ALTER TABLE "Prize" DROP COLUMN "win_message_en";