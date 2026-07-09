import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { sendMail } from "@/lib/mailer";
import { statusUpdateEmail } from "@/lib/email-templates";

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
