import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_CONFIGURED, readLocalObject } from "@/lib/s3";

// Best-effort content type from a file name (dev local-storage fallback).
function contentTypeFromName(name: string): string {
    const ext = name.toLowerCase().split(".").pop() ?? "";
    switch (ext) {
        case "pdf": return "application/pdf";
        case "jpg":
        case "jpeg": return "image/jpeg";
        case "png": return "image/png";
        case "webp": return "image/webp";
        default: return "application/octet-stream";
    }
}

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
            const docWithName = target as { fileName?: string; invoiceNumber?: string };
            fileName = docWithName.fileName ?? docWithName.invoiceNumber ?? `Document_${id}.pdf`;
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

        // Dev fallback: stream the locally-stored file directly.
        if (!S3_CONFIGURED) {
            const buffer = await readLocalObject(s3Key);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": contentTypeFromName(fileName),
                    "Content-Disposition": `attachment; filename="${fileName}"`,
                },
            });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: s3Key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Failed to generate signed URL:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
