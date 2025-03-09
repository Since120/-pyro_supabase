/*
  Warnings:

  - You are about to drop the column `guildId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isDeletedInDiscord` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isSendSetup` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isTrackingActive` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "guildId",
DROP COLUMN "isDeletedInDiscord",
DROP COLUMN "isSendSetup",
DROP COLUMN "isTrackingActive",
ADD COLUMN     "deletedInDiscord" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guild_id" TEXT NOT NULL DEFAULT 'default_guild',
ADD COLUMN     "sendSetup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingActive" BOOLEAN NOT NULL DEFAULT false;
