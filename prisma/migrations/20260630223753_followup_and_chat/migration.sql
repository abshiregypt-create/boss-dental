-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "followupSentAt" DATETIME;

-- AlterTable
ALTER TABLE "WaConversation" ADD COLUMN "agentPausedUntil" DATETIME;

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "chatId" TEXT,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'chat',
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ChatMessage_phone_createdAt_idx" ON "ChatMessage"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_direction_readAt_idx" ON "ChatMessage"("direction", "readAt");
