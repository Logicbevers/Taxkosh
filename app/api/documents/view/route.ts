import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_CONFIGURED, readLocalObject } from "@/lib/s3";

const ADMIN_ROLES = ["ADMIN", "TAX_EXECUTIVE", "SENIOR_REVIEWER"];

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

/**
 * Stream/redirect a stored file by its storage key (`?key=`).
 * Used by the admin console (documents + filed acknowledgements) and by the
 * dev local-storage fallback URL from generateSignedViewUrl().
 *
 * Authorization: admins can open any key; other users only keys that belong
 * to one of their own documents, invoices, or filed acknowledgements.
 */
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const s3Key = searchParams.get("key");
        if (!s3Key) {
            return NextResponse.json({ error: "Missing key" }, { status: 400 });
        }

        const isAdmin = ADMIN_ROLES.includes(session.user.role ?? "");
        if (!isAdmin) {
            // Ownership check: the key must belong to one of the caller's records.
            const [doc, inv, sr] = await Promise.all([
                prisma.document.findFirst({ where: { s3Key, userId: session.user.id }, select: { id: true } }),
                prisma.platformInvoice.findFirst({ where: { s3Key, userId: session.user.id }, select: { id: true } }),
                prisma.serviceRequest.findFirst({
                    where: { filedAcknowledgementS3Key: s3Key, userId: session.user.id },
                    select: { id: true },
                }),
            ]);
            if (!doc && !inv && !sr) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const fileName = s3Key.split("/").pop() ?? "document";

        // Dev fallback: stream the locally-stored file directly.
        if (!S3_CONFIGURED) {
            const buffer = await readLocalObject(s3Key);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": contentTypeFromName(fileName),
                    "Content-Disposition": `inline; filename="${fileName}"`,
                },
            });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: s3Key,
            ResponseContentDisposition: `inline; filename="${fileName}"`,
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        return NextResponse.redirect(url);
    } catch (error) {
        console.error("Document view-by-key failed:", error);
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
