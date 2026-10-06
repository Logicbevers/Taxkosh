import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_CONFIGURED, readLocalObject } from "@/lib/s3";
import { parseDocumentRules } from "@/lib/document-rules";

/**
 * Serve a consent PDF (?key=) attached to a service's document rule.
 *
 * Consent terms are meant to be read BEFORE purchase, so no sign-in is required —
 * but the key must actually be referenced by an active CatalogNode's documentRules,
 * which stops this from becoming an arbitrary-S3-key reader.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const s3Key = searchParams.get("key");
        if (!s3Key) {
            return NextResponse.json({ error: "Missing key" }, { status: 400 });
        }

        // Authorization: the key must be a consent PDF referenced by some active node.
        const candidates = await prisma.catalogNode.findMany({
            where: { status: "active", isLeaf: true, documentRules: { not: null as never } },
            select: { documentRules: true },
        });
        const referenced = candidates.some((n) =>
            parseDocumentRules(n.documentRules).some((r) => r.consentPdfS3Key === s3Key)
        );
        if (!referenced) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const fileName = s3Key.split("/").pop() ?? "consent.pdf";

        if (!S3_CONFIGURED) {
            const buffer = await readLocalObject(s3Key);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": "application/pdf",
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
        console.error("Consent view failed:", error);
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
