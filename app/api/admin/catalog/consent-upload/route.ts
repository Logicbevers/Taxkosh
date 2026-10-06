import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { uploadToS3 } from "@/lib/s3";
import { scanBuffer, verifyMagicBytes } from "@/lib/virus-scan";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Admin-only upload of a consent PDF attached to a service's document rule.
 * Returns the storage key to persist in CatalogNode.documentRules[].consentPdfS3Key.
 * The file is served back to customers by GET /api/catalog/consent?key=.
 *
 * PDF only — a consent document is terms to read, not an image. Reuses the same
 * magic-byte + malware checks as the customer document upload.
 */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Consent document must be a PDF" }, { status: 400 });
        }
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size: 10 MB" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (!verifyMagicBytes(buffer, file.type)) {
            return NextResponse.json({ error: "File contents don't match a PDF." }, { status: 400 });
        }
        const scan = await scanBuffer(buffer, file.name);
        if (!scan.clean) {
            return NextResponse.json({ error: scan.reason ?? "File failed the malware scan" }, { status: 400 });
        }

        const s3Key = await uploadToS3(buffer, `consent-${file.name}`, file.type);
        return NextResponse.json({ success: true, s3Key });
    } catch (error) {
        console.error("[Consent Upload Error]", error);
        return NextResponse.json({ error: "Failed to upload consent document" }, { status: 500 });
    }
}
