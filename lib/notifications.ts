import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus, UserRole } from "@prisma/client";
import { sendMail } from "@/lib/mailer";
import { statusUpdateEmail, adminAlertEmail } from "@/lib/email-templates";

const OPS_ROLES: UserRole[] = ["ADMIN", "TAX_EXECUTIVE", "SENIOR_REVIEWER"];

type NotificationTrigger = {
    userId: string;
    serviceRequestId: string;
    serviceName: string;
    status: ServiceRequestStatus;
    userEmail: string;
};

export async function triggerStatusNotification({
    userId,
    serviceRequestId,
    serviceName,
    status,
    userEmail
}: NotificationTrigger) {
    const statusMessages: Record<ServiceRequestStatus, { title: string; message: string }> = {
        CREATED: { title: "Order Created", message: `Your request for ${serviceName} has been created.` },
        PAYMENT_PENDING: { title: "Payment Pending", message: `Payment for your ${serviceName} request is pending.` },
        PAID: { title: "Payment Successful", message: `We have received your payment for ${serviceName}.` },
        DOCUMENTS_PENDING: { title: "Documents Required", message: `Action Required: Please upload the required documents for your ${serviceName} request.` },
        DOCUMENTS_SUBMITTED: { title: "Documents Received", message: `We have received your documents for ${serviceName} and are reviewing them.` },
        UNDER_PROCESS: { title: "Processing Started", message: `Your ${serviceName} request is now under review by our tax experts.` },
        CLARIFICATION_REQUIRED: { title: "Clarification Needed", message: `Our team needs some clarifications regarding your ${serviceName} request.` },
        READY_FOR_FILING: { title: "Ready for Filing", message: `Your tax return for ${serviceName} is ready and waiting for final filing.` },
        FILED: { title: "Return Filed", message: `Great news! Your ${serviceName} return has been successfully filed.` },
        COMPLETED: { title: "Request Completed", message: `Your ${serviceName} request has been successfully completed.` },
        REJECTED: { title: "Request Rejected", message: `Your ${serviceName} request has been rejected. Check internal notes for details.` },
    };

    const notification = statusMessages[status];
    if (!notification) return;

    // 1. In-App Notification
    await prisma.notification.create({
        data: {
            userId,
            title: notification.title,
            message: notification.message,
            type: status === "REJECTED" ? "error" : "info",
        }
    });

    // 2. Email notification (branded template; never throws — a failed email
    //    must not break the status transition that triggered it).
    const { subject, html } = statusUpdateEmail({
        title: notification.title,
        message: notification.message,
        serviceRequestId,
    });
    await sendMail({ to: userEmail, subject, html });
}

/**
 * Notify the ops/CA team that a request needs their attention (e.g. the
 * customer just submitted documents). Emails + in-app notifies the assigned
 * staff member if one is set, otherwise every ops-role user. Best-effort:
 * a failure here must never break the customer-facing action that triggered it.
 */
export async function triggerAdminAlert(opts: {
    serviceRequestId: string;
    title: string;
    message: string;
}) {
    const { serviceRequestId, title, message } = opts;
    try {
        const req = await prisma.serviceRequest.findUnique({
            where: { id: serviceRequestId },
            select: { assignedToId: true },
        });

        // Prefer the assigned staff member; otherwise every ops-role user.
        const assignee = req?.assignedToId
            ? await prisma.user.findUnique({
                where: { id: req.assignedToId },
                select: { id: true, email: true },
            })
            : null;

        const recipients = assignee
            ? [assignee]
            : await prisma.user.findMany({
                where: { role: { in: OPS_ROLES } },
                select: { id: true, email: true },
            });

        if (recipients.length === 0) return;

        await prisma.notification.createMany({
            data: recipients.map((r) => ({ userId: r.id, title, message, type: "info" as const })),
        });

        const { subject, html } = adminAlertEmail({ title, message, serviceRequestId });
        await Promise.all(recipients.map((r) => sendMail({ to: r.email, subject, html })));
    } catch (err) {
        console.error("triggerAdminAlert failed (non-fatal):", err);
    }
}
