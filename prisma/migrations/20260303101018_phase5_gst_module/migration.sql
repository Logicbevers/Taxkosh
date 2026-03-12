-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SALES', 'PURCHASE');

-- CreateTable
CREATE TABLE "gst_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gst_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "counterpartyName" TEXT,
    "counterpartyGstin" TEXT,
    "items" JSONB NOT NULL,
    "totalTaxableValue" DOUBLE PRECISION NOT NULL,
    "totalCgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gst_profiles_userId_key" ON "gst_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "gst_profiles_gstin_key" ON "gst_profiles"("gstin");

-- CreateIndex
CREATE INDEX "invoices_userId_type_date_idx" ON "invoices"("userId", "type", "date");

-- AddForeignKey
ALTER TABLE "gst_profiles" ADD CONSTRAINT "gst_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
