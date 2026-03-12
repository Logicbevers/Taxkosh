import { PrismaClient, AuditAction } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Centrally log audit events for compliance & monitoring
 */
export async function logAudit({
    userId,
    action,
    entityId,
    entityType,
    details,
    req
}: {
    userId?: string;
    action: AuditAction;
    entityId?: string;
    entityType?: string;
    details?: any;
    req?: Request | any;
}) {
    try {
        const ipAddress = req?.headers?.get("x-forwarded-for") || "internal";
        const userAgent = req?.headers?.get("user-agent") || "unknown";

        return await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityId,
                entityType,
                details: details || {},
                ipAddress,
                userAgent
            }
        });
    } catch (e) {
        console.error("Failed to write audit log:", e);
    }
}
