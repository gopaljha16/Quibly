-- Add audit logs table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "changes" JSONB DEFAULT '{}',
    "reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Add auto-moderation rules table
CREATE TABLE "AutoModRule" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerMetadata" JSONB DEFAULT '{}',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "exemptRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exemptChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoModRule_pkey" PRIMARY KEY ("id")
);

-- Add member screening table
CREATE TABLE "MemberScreening" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberScreening_pkey" PRIMARY KEY ("id")
);

-- Add member screening responses table
CREATE TABLE "MemberScreeningResponse" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberScreeningResponse_pkey" PRIMARY KEY ("id")
);

-- Add welcome screen table
CREATE TABLE "WelcomeScreen" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "welcomeChannels" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelcomeScreen_pkey" PRIMARY KEY ("id")
);

-- Add fields to ServerMember for verification
ALTER TABLE "ServerMember" ADD COLUMN "verificationStatus" TEXT DEFAULT 'unverified';
ALTER TABLE "ServerMember" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "ServerMember" ADD COLUMN "screeningPassed" BOOLEAN DEFAULT false;

-- Add fields to Server for enhanced moderation
ALTER TABLE "Server" ADD COLUMN "autoModEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "Server" ADD COLUMN "welcomeScreenEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "Server" ADD COLUMN "memberScreeningEnabled" BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX "AuditLog_serverId_idx" ON "AuditLog"("serverId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX "AuditLog_serverId_createdAt_idx" ON "AuditLog"("serverId", "createdAt" DESC);

CREATE INDEX "AutoModRule_serverId_idx" ON "AutoModRule"("serverId");
CREATE INDEX "AutoModRule_enabled_idx" ON "AutoModRule"("enabled");

CREATE UNIQUE INDEX "MemberScreening_serverId_key" ON "MemberScreening"("serverId");

CREATE UNIQUE INDEX "MemberScreeningResponse_serverId_userId_key" ON "MemberScreeningResponse"("serverId", "userId");
CREATE INDEX "MemberScreeningResponse_status_idx" ON "MemberScreeningResponse"("status");

CREATE UNIQUE INDEX "WelcomeScreen_serverId_key" ON "WelcomeScreen"("serverId");

-- Add foreign keys
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoModRule" ADD CONSTRAINT "AutoModRule_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberScreening" ADD CONSTRAINT "MemberScreening_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberScreeningResponse" ADD CONSTRAINT "MemberScreeningResponse_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberScreeningResponse" ADD CONSTRAINT "MemberScreeningResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WelcomeScreen" ADD CONSTRAINT "WelcomeScreen_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
