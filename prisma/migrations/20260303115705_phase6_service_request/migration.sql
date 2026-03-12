-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('ITR_FILING', 'GST_FILING', 'TDS_FILING', 'BUSINESS_COMPLIANCE');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING_DOCUMENTS', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'COMPLETED', 'FILED', 'REJECTED');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "serviceRequestId" TEXT;

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING_DOCUMENTS',
    "assignedToId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_requests_userId_idx" ON "service_requests"("userId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
