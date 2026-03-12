/*
  Warnings:

  - A unique constraint covering the columns `[razorpayOrderId]` on the table `service_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `service_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceRequestStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "ServiceRequestStatus" ADD VALUE 'PAYMENT_CONFIRMED';

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- CreateTable
CREATE TABLE "platform_invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "cgst" INTEGER NOT NULL,
    "sgst" INTEGER NOT NULL,
    "igst" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "s3Key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_serviceRequestId_key" ON "platform_invoices"("serviceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_invoiceNumber_key" ON "platform_invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "platform_invoices_userId_idx" ON "platform_invoices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_razorpayOrderId_key" ON "service_requests"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_razorpayPaymentId_key" ON "service_requests"("razorpayPaymentId");

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
