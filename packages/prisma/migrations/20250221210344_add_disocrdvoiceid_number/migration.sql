/*
  Warnings:

  - The `discordVoiceId` column on the `Zone` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "discordVoiceId",
ADD COLUMN     "discordVoiceId" INTEGER;
