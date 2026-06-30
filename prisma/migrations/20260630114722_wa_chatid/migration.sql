-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "waChatId" TEXT;

-- AlterTable
ALTER TABLE "WaConversation" ADD COLUMN "chatId" TEXT;

-- AlterTable
ALTER TABLE "WaOutbox" ADD COLUMN "chatId" TEXT;
