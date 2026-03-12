import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, ServiceRequestStatus } from "@prisma/client";
import { uploadToS3 } from "@/lib/s3";
import { resend } from "@/lib/resend";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
            include: { user: true }
        });

        // 3. Notify User
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: "TaxKosh Filing <filing@taxkosh.com>",
                to: [updatedRequest.user.email],
                subject: `Filing Completed - ${updatedRequest.category.replace(/_/g, " ")}`,
                html: `
                    <div>
                        <h1>Filing Successfully Completed!</h1>
                        <p>Hi ${updatedRequest.user.name || "User"},</p>
                        <p>We are pleased to inform you that your <strong>${updatedRequest.category.replace(/_/g, " ")}</strong> has been filed successfully.</p>
                        <p>You can download your official acknowledgement from the TaxKosh dashboard.</p>
                        <p><br/>Best regards,<br/>The TaxKosh Filing Team</p>
                    </div>
                `
            });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Filing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
