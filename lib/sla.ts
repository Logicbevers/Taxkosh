import type { ServiceRequest, Service } from "@prisma/client";

export type SlaStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export interface SlaResult {
    hoursElapsed: number;
    slaStatus: SlaStatus;
    slaLimitHours: number;
}

/**
 * Single source of truth for the SLA clock on a service request.
 * Used by both the list and detail admin endpoints so they never drift.
 *
 * Rules:
 *  - Before payment (CREATED / PAYMENT_PENDING): show time since creation, always HEALTHY
 *    (the operational SLA doesn't start until the customer has paid).
 *  - After payment (slaDeadline set): clock runs from the payment time.
 *      - COMPLETED / FILED: clock frozen at completion, always HEALTHY.
 *      - otherwise: WARNING past 75% of the window, CRITICAL past 100%.
 *  - Legacy rows without slaDeadline: fall back to time since creation.
 */
export function computeSla(
    req: Pick<ServiceRequest, "status" | "createdAt" | "updatedAt" | "slaDeadline"> & {
        service?: Pick<Service, "slaHours"> | null;
    }
): SlaResult {
    const slaLimitHours = req.service?.slaHours ?? 24;
    const now = Date.now();
    const HOUR = 1000 * 60 * 60;

    let hoursElapsed = 0;
    let slaStatus: SlaStatus = "HEALTHY";

    if (req.status === "CREATED" || req.status === "PAYMENT_PENDING") {
        hoursElapsed = Math.floor((now - req.createdAt.getTime()) / HOUR);
        slaStatus = "HEALTHY";
    } else if (req.slaDeadline) {
        const paidAt = req.slaDeadline.getTime() - slaLimitHours * HOUR;
        if (req.status === "COMPLETED" || req.status === "FILED") {
            hoursElapsed = Math.max(0, Math.floor((req.updatedAt.getTime() - paidAt) / HOUR));
            slaStatus = "HEALTHY";
        } else {
            hoursElapsed = Math.max(0, Math.floor((now - paidAt) / HOUR));
            slaStatus =
                hoursElapsed > slaLimitHours ? "CRITICAL"
                : hoursElapsed > slaLimitHours * 0.75 ? "WARNING"
                : "HEALTHY";
        }
    } else {
        hoursElapsed = Math.floor((now - req.createdAt.getTime()) / HOUR);
        slaStatus =
            hoursElapsed > slaLimitHours ? "CRITICAL"
            : hoursElapsed > slaLimitHours * 0.75 ? "WARNING"
            : "HEALTHY";
    }

    return { hoursElapsed, slaStatus, slaLimitHours };
}
