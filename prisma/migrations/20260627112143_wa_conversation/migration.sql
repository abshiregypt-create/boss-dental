-- CreateTable
CREATE TABLE "WaConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'idle',
    "draft" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'ar',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WaConversation_phone_key" ON "WaConversation"("phone");

-- CreateIndex
CREATE INDEX "WaConversation_updatedAt_idx" ON "WaConversation"("updatedAt");
