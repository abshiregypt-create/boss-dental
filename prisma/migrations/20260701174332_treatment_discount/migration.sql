-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TreatmentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "procedureId" TEXT,
    "appointmentId" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "basePrice" REAL,
    "discountPct" REAL NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TreatmentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TreatmentRecord_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "Procedure" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TreatmentRecord" ("appointmentId", "createdAt", "id", "nameAr", "nameEn", "notes", "patientId", "performedAt", "price", "procedureId", "updatedAt") SELECT "appointmentId", "createdAt", "id", "nameAr", "nameEn", "notes", "patientId", "performedAt", "price", "procedureId", "updatedAt" FROM "TreatmentRecord";
DROP TABLE "TreatmentRecord";
ALTER TABLE "new_TreatmentRecord" RENAME TO "TreatmentRecord";
CREATE INDEX "TreatmentRecord_patientId_performedAt_idx" ON "TreatmentRecord"("patientId", "performedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
