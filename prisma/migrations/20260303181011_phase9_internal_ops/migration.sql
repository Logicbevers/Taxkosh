-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'TAX_EXECUTIVE';
ALTER TYPE "UserRole" ADD VALUE 'SENIOR_REVIEWER';

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "filedAcknowledgementS3Key" TEXT,
ADD COLUMN     "slaDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "internal_notes" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_notes_serviceRequestId_idx" ON "internal_notes"("serviceRequestId");

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
