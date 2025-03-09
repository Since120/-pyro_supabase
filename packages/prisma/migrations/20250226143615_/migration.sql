/*
  Warnings:

  - You are about to drop the column `deletedInDiscord` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `guild_id` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `sendSetup` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `trackingActive` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "deletedInDiscord",
DROP COLUMN "guild_id",
DROP COLUMN "sendSetup",
DROP COLUMN "trackingActive",
ADD COLUMN     "guildId" TEXT NOT NULL DEFAULT 'default_guild',
ADD COLUMN     "isDeletedInDiscord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSendSetup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTrackingActive" BOOLEAN NOT NULL DEFAULT false;
