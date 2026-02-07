-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CUSTOM', 'LISTENING', 'WATCHING', 'COMPETING', 'STREAMING');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "customStatusExpiresAt" TIMESTAMP(3),
ADD COLUMN "currentActivity" JSONB;

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL DEFAULT 'CUSTOM',
    "name" TEXT NOT NULL,
    "details" TEXT,
    "state" TEXT,
    "emoji" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_userId_startedAt_idx" ON "UserActivity"("userId", "startedAt");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
