/*
  Warnings:

  - You are about to drop the `VoiceSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VoiceSession" DROP CONSTRAINT "VoiceSession_channelId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceSession" DROP CONSTRAINT "VoiceSession_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bannerPublicId" TEXT,
ADD COLUMN     "customStatusEmoji" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "themeColor" TEXT DEFAULT '#5865F2';

-- DropTable
DROP TABLE "VoiceSession";
