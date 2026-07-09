/*
  Warnings:

  - The values [PENDING_DOCUMENTS,UNDER_REVIEW,PENDING_PAYMENT,PAYMENT_CONFIRMED] on the enum `ServiceRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `service_requests` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ServiceRequestStatus_new" AS ENUM ('CREATED', 'PAYMENT_PENDING', 'PAID', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_PROCESS', 'CLARIFICATION_REQUIRED', 'READY_FOR_FILING', 'FILED', 'COMPLETED', 'REJECTED');
ALTER TABLE "service_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "ServiceRequestStatus_new" USING ("status"::text::"ServiceRequestStatus_new");
ALTER TYPE "ServiceRequestStatus" RENAME TO "ServiceRequestStatus_old";
ALTER TYPE "ServiceRequestStatus_new" RENAME TO "ServiceRequestStatus";
DROP TYPE "ServiceRequestStatus_old";
ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterTable
ALTER TABLE "service_requests" DROP COLUMN "category",
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "serviceId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_planId_fkey" FOREIGN KEY ("planId") REFERENCES "service_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
