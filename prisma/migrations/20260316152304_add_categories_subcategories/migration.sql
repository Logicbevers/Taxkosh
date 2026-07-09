-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'DATA_EXPORT', 'DOCUMENT_UPLOAD', 'DOCUMENT_VIEW', 'PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PROFILE_UPDATE', 'SENSITIVE_DATA_ACCESS', 'ITR_SUBMISSION');

-- CreateEnum
CREATE TYPE "TdsFormType" AS ENUM ('FORM_24Q', 'FORM_26Q', 'FORM_27Q', 'FORM_27EQ');

-- CreateEnum
CREATE TYPE "TdsReturnStatus" AS ENUM ('DRAFT', 'CHALLAN_PENDING', 'READY_TO_FILE', 'FILED');

-- CreateEnum
CREATE TYPE "DeducteeCategory" AS ENUM ('COMPANY', 'NON_COMPANY');

-- AlterTable
ALTER TABLE "file_access_logs" ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tds_returns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "formType" "TdsFormType" NOT NULL,
    "status" "TdsReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tds_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tds_deductees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DeducteeCategory" NOT NULL DEFAULT 'NON_COMPANY',

    CONSTRAINT "tds_deductees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tds_entries" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "deducteeId" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "dateOfPayment" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "tdsRate" DOUBLE PRECISION NOT NULL,
    "tdsAmount" DOUBLE PRECISION NOT NULL,
    "surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "educationCess" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTds" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "tds_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tds_challans" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "bsrCode" TEXT NOT NULL,
    "dateOfDeposit" TIMESTAMP(3) NOT NULL,
    "challanSerial" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "interest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "tds_challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "tds_returns_userId_financialYear_quarter_formType_key" ON "tds_returns"("userId", "financialYear", "quarter", "formType");

-- CreateIndex
CREATE INDEX "tds_deductees_userId_idx" ON "tds_deductees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_returns" ADD CONSTRAINT "tds_returns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_deductees" ADD CONSTRAINT "tds_deductees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_entries" ADD CONSTRAINT "tds_entries_deducteeId_fkey" FOREIGN KEY ("deducteeId") REFERENCES "tds_deductees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_entries" ADD CONSTRAINT "tds_entries_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "tds_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tds_challans" ADD CONSTRAINT "tds_challans_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "tds_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
