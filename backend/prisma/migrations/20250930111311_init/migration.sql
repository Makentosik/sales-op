-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."PeriodType" AS ENUM ('MONTHLY', 'TEN_DAYS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."PeriodStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."LogType" AS ENUM ('PAYMENT', 'PARTICIPANT_JOIN', 'PARTICIPANT_LEAVE', 'GRADE_CHANGE', 'PERIOD_START', 'PERIOD_END', 'SYSTEM', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."WarningStatus" AS ENUM ('WARNING_90', 'WARNING_80');

-- CreateEnum
CREATE TYPE "public"."TransitionType" AS ENUM ('PROMOTION', 'DEMOTION', 'INITIAL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gradeId" TEXT,
    "warningStatus" "public"."WarningStatus",
    "warningPeriodsLeft" INTEGER NOT NULL DEFAULT 0,
    "lastPeriodRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCompletionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan" DOUBLE PRECISION NOT NULL,
    "minRevenue" DOUBLE PRECISION NOT NULL,
    "maxRevenue" DOUBLE PRECISION NOT NULL,
    "performanceLevels" JSONB NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#006657',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Period" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "public"."PeriodType" NOT NULL DEFAULT 'MONTHLY',
    "status" "public"."PeriodStatus" NOT NULL DEFAULT 'PENDING',
    "participantSnapshots" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PeriodGrade" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Log" (
    "id" TEXT NOT NULL,
    "type" "public"."LogType" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "participantId" TEXT,
    "periodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeTransition" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fromGradeId" TEXT,
    "toGradeId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "transitionType" "public"."TransitionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "completionPercentage" DOUBLE PRECISION NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_telegramId_key" ON "public"."Participant"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_key" ON "public"."Grade"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodGrade_periodId_gradeId_key" ON "public"."PeriodGrade"("periodId", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_participantId_periodId_key" ON "public"."Payment"("participantId", "periodId");

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PeriodGrade" ADD CONSTRAINT "PeriodGrade_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PeriodGrade" ADD CONSTRAINT "PeriodGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTransition" ADD CONSTRAINT "GradeTransition_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTransition" ADD CONSTRAINT "GradeTransition_fromGradeId_fkey" FOREIGN KEY ("fromGradeId") REFERENCES "public"."Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTransition" ADD CONSTRAINT "GradeTransition_toGradeId_fkey" FOREIGN KEY ("toGradeId") REFERENCES "public"."Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeTransition" ADD CONSTRAINT "GradeTransition_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "public"."Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
