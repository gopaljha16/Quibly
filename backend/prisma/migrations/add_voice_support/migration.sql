-- Add voice-related fields to Channel if not exists
-- Note: VOICE type already exists in ChannelType enum

-- Optional: Add voice session tracking table
CREATE TABLE IF NOT EXISTS "VoiceSession" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "duration" INTEGER,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isDeafened" BOOLEAN NOT NULL DEFAULT false,
    "hasVideo" BOOLEAN NOT NULL DEFAULT false,
    "hasScreenShare" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "VoiceSession_channelId_idx" ON "VoiceSession"("channelId");
CREATE INDEX IF NOT EXISTS "VoiceSession_userId_idx" ON "VoiceSession"("userId");
CREATE INDEX IF NOT EXISTS "VoiceSession_joinedAt_idx" ON "VoiceSession"("joinedAt");

-- Add foreign keys
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_channelId_fkey" 
    FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
