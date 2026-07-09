import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { uploadToS3 } from "@/lib/s3";
import { triggerStatusNotification } from "@/lib/notifications";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const resolvedParams = await params;

        if (!file) {
            return NextResponse.json({ error: "Acknowledgement file is required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `ACK-${resolvedParams.id.split("-")[0]}-${file.name}`;

        // 1. Upload to S3
        const s3Key = await uploadToS3(buffer, fileName, file.type);

        // 2. Update Request Status
        const updatedRequest = await prisma.serviceRequest.update({
            where: { id: resolvedParams.id },
            data: {
                status: ServiceRequestStatus.FILED,
                filedAcknowledgementS3Key: s3Key
            },
            include: { user: true, service: true }
        });

        // 3. Notify User via Unified Notification Engine
        await triggerStatusNotification({
            userId: updatedRequest.userId,
            serviceRequestId: updatedRequest.id,
            serviceName: updatedRequest.service?.name || "Service",
            status: updatedRequest.status,
            userEmail: updatedRequest.user.email
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Filing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
