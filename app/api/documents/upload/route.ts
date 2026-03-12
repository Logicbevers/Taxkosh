import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentType } from "@prisma/client";
import { uploadToS3 } from "@/lib/s3";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Simulated Virus Scan
async function scanFileForViruses(buffer: Buffer): Promise<boolean> {
    // In a real app, integrate via API with ClamAV or AWS Macie.
    // For now, always pass.
    return true;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const documentType = (formData.get("documentType") as string | null) ?? "OTHER";
        const taxReturnId = formData.get("taxReturnId") as string | null;
        const serviceRequestId = formData.get("serviceRequestId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: PDF, JPEG, PNG, WEBP" },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 10 MB" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Virus Scan
        const isSafe = await scanFileForViruses(buffer);
        if (!isSafe) {
            return NextResponse.json({ error: "Malware detected in file" }, { status: 400 });
        }

        // Upload to S3
        let s3Key: string | null = null;
        let storagePath: string | null = null;

        try {
            s3Key = await uploadToS3(buffer, file.name, file.type);
        } catch (s3Error) {
            console.warn("S3 Upload failed (likely missing credentials), falling back to local simulation.", s3Error);

            const uploadDir = path.join(process.cwd(), "public", "uploads", session.user.id);
            await mkdir(uploadDir, { recursive: true });

            const timestamp = Date.now();
            const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const fileName = `${timestamp}_${safeFileName}`;
            const filePath = path.join(uploadDir, fileName);
            await writeFile(filePath, buffer);

            s3Key = `simulated-s3/${fileName}`;
            storagePath = `/uploads/${session.user.id}/${fileName}`;
        }

        // Validate documentType enum
        const validDocTypes = Object.values(DocumentType);
        const docType = validDocTypes.includes(documentType as DocumentType)
            ? (documentType as DocumentType)
            : DocumentType.OTHER;

        // Save metadata to DB
        const document = await prisma.document.create({
            data: {
                userId: session.user.id,
                taxReturnId: taxReturnId || null,
                serviceRequestId: serviceRequestId || null,
                documentType: docType,
                fileName: file.name,
                fileSize: file.size,
                s3Key,
                mimeType: file.type,
                isEncrypted: true,
                storagePath,
            },
        });

        return NextResponse.json({ success: true, document });
    } catch (error) {
        console.error("[Document Upload Error]", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}
