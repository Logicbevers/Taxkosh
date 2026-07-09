-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "catalogNodeId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phoneVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "catalog_nodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isLeaf" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "requiredDocuments" TEXT[],
    "slaHours" INTEGER NOT NULL DEFAULT 24,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_nodes_slug_key" ON "catalog_nodes"("slug");

-- CreateIndex
CREATE INDEX "catalog_nodes_parentId_idx" ON "catalog_nodes"("parentId");

-- CreateIndex
CREATE INDEX "catalog_nodes_depth_status_idx" ON "catalog_nodes"("depth", "status");

-- CreateIndex
CREATE INDEX "phone_otps_userId_idx" ON "phone_otps"("userId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_catalogNodeId_fkey" FOREIGN KEY ("catalogNodeId") REFERENCES "catalog_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_nodes" ADD CONSTRAINT "catalog_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "catalog_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_otps" ADD CONSTRAINT "phone_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
