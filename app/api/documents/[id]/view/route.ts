import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        let s3Key = "";
        let fileName = "";

        if (type === "filed") {
            // Fetch the service request to get the filed acknowledgement key
            const serviceRequest = await prisma.serviceRequest.findUnique({
                where: { id, userId: session.user.role === "ADMIN" ? undefined : session.user.id }
            });

            if (!serviceRequest || !serviceRequest.filedAcknowledgementS3Key) {
                return NextResponse.json({ error: "Document not found" }, { status: 404 });
            }
            s3Key = serviceRequest.filedAcknowledgementS3Key;
            fileName = `Filed_Acknowledgement_${id}.pdf`;
        } else {
            // Normal document or platform invoice
            // For simplicity in this demo, we check both tables or the user can specify
            const doc = await prisma.document.findUnique({ where: { id } });
            const inv = !doc ? await prisma.platformInvoice.findUnique({ where: { id } }) : null;

            const target = doc || inv;

            if (!target) {
                return NextResponse.json({ error: "Document not found" }, { status: 404 });
            }

            // Authorization check
            if (session.user.role !== "ADMIN" && target.userId !== session.user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            s3Key = target.s3Key!;
            fileName = (target as any).fileName || (target as any).invoiceNumber || `Document_${id}.pdf`;
        }

        let url = "";
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: s3Key,
                ResponseContentDisposition: `attachment; filename="${fileName}"`,
            });
            url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (s3Error) {
            if (process.env.TESTING_MODE) {
                console.warn("S3 signed URL generation failed, using fallback for testing");
                url = `https://example.com/fallback-doc/${id}`;
            } else {
                throw s3Error;
            }
        }

        // Audit Logging
        const { logAudit } = await import("@/lib/prisma");
        const { AuditAction } = await import("@prisma/client");
        await logAudit({
            userId: session.user.id,
            action: AuditAction.DOCUMENT_VIEW,
            entityId: id,
            entityType: type === "filed" ? "ServiceRequest" : "Document",
            details: { type, fileName }
        });

        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Failed to generate signed URL:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
