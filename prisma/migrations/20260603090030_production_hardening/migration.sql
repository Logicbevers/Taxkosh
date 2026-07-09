-- DropEnum
DROP TYPE "ServiceCategory";

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_serviceRequestId_idx" ON "documents"("serviceRequestId");

-- CreateIndex
CREATE INDEX "documents_taxReturnId_idx" ON "documents"("taxReturnId");

-- CreateIndex
CREATE INDEX "service_requests_assignedToId_idx" ON "service_requests"("assignedToId");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- CreateIndex
CREATE INDEX "tds_entries_deducteeId_idx" ON "tds_entries"("deducteeId");

-- CreateIndex
CREATE INDEX "tds_entries_returnId_idx" ON "tds_entries"("returnId");
