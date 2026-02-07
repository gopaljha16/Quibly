-- AlterEnum
ALTER TYPE "ChannelType" ADD VALUE 'ANNOUNCEMENT';
ALTER TYPE "ChannelType" ADD VALUE 'RULES';

-- AlterTable
ALTER TABLE "Server" ADD COLUMN "vanityUrl" TEXT,
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPartnered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "rules" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "announcementChannelId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Server_vanityUrl_key" ON "Server"("vanityUrl");

-- CreateIndex
CREATE INDEX "Server_vanityUrl_idx" ON "Server"("vanityUrl");

-- CreateTable
CREATE TABLE "ServerAnalytics" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newMembers" INTEGER NOT NULL DEFAULT 0,
    "leftMembers" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "voiceMinutes" INTEGER NOT NULL DEFAULT 0,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ServerAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "channels" JSONB NOT NULL DEFAULT '[]',
    "roles" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerAnalytics_serverId_date_key" ON "ServerAnalytics"("serverId", "date");

-- CreateIndex
CREATE INDEX "ServerAnalytics_serverId_date_idx" ON "ServerAnalytics"("serverId", "date");

-- CreateIndex
CREATE INDEX "ServerTemplate_category_idx" ON "ServerTemplate"("category");

-- CreateIndex
CREATE INDEX "ServerTemplate_isOfficial_idx" ON "ServerTemplate"("isOfficial");

-- AddForeignKey
ALTER TABLE "ServerAnalytics" ADD CONSTRAINT "ServerAnalytics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
