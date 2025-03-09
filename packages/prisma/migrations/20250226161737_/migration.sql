/*
  Warnings:

  - You are about to drop the column `guild_id` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "guild_id",
ADD COLUMN     "guildId" TEXT NOT NULL DEFAULT 'default_guild';
