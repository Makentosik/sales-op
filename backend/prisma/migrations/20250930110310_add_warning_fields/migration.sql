-- AlterTable
ALTER TABLE "Period" ADD COLUMN "participantSnapshots" JSONB;

-- CreateTable
CREATE TABLE "GradeTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "fromGradeId" TEXT,
    "toGradeId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "transitionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "completionPercentage" REAL NOT NULL,
    "revenue" REAL NOT NULL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GradeTransition_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradeTransition_fromGradeId_fkey" FOREIGN KEY ("fromGradeId") REFERENCES "Grade" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GradeTransition_toGradeId_fkey" FOREIGN KEY ("toGradeId") REFERENCES "Grade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GradeTransition_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "revenue" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "gradeId" TEXT,
    "warningStatus" TEXT,
    "warningPeriodsLeft" INTEGER NOT NULL DEFAULT 0,
    "lastPeriodRevenue" REAL NOT NULL DEFAULT 0,
    "lastCompletionPercentage" REAL NOT NULL DEFAULT 0,
    "userId" TEXT,
    CONSTRAINT "Participant_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("createdAt", "firstName", "gradeId", "id", "isActive", "joinedAt", "lastName", "phoneNumber", "revenue", "telegramId", "updatedAt", "userId", "username") SELECT "createdAt", "firstName", "gradeId", "id", "isActive", "joinedAt", "lastName", "phoneNumber", "revenue", "telegramId", "updatedAt", "userId", "username" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_telegramId_key" ON "Participant"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
