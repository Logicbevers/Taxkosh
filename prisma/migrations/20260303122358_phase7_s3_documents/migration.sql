/*
  Warnings:

  - A unique constraint covering the columns `[s3Key]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "s3Key" TEXT,
ALTER COLUMN "storagePath" DROP NOT NULL;

-- CreateTable
CREATE TABLE "file_access_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "file_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_access_logs_documentId_idx" ON "file_access_logs"("documentId");

-- CreateIndex
CREATE INDEX "file_access_logs_userId_idx" ON "file_access_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_s3Key_key" ON "documents"("s3Key");

-- AddForeignKey
ALTER TABLE "file_access_logs" ADD CONSTRAINT "file_access_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_access_logs" ADD CONSTRAINT "file_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
