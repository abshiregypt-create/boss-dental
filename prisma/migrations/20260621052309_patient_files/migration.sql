-- CreateTable
CREATE TABLE "PatientFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientKey" TEXT NOT NULL,
    "patientName" TEXT,
    "category" TEXT NOT NULL DEFAULT 'xray',
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PatientFile_patientKey_createdAt_idx" ON "PatientFile"("patientKey", "createdAt");
