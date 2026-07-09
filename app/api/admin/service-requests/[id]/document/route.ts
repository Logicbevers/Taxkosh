import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";

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
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `MANUAL-${resolvedParams.id.split("-")[0]}-${file.name}`;

        // 1. Get request to find userId
        const serviceReq = await prisma.serviceRequest.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!serviceReq) {
            return NextResponse.json({ error: "Service Request not found" }, { status: 404 });
        }

        // 2. Upload to S3
        const s3Key = await uploadToS3(buffer, fileName, file.type);

        // 3. Create Document record
        const document = await prisma.document.create({
            data: {
                userId: serviceReq.userId,
                serviceRequestId: serviceReq.id,
                fileName: file.name,
                fileSize: file.size,
                s3Key: s3Key,
                mimeType: file.type,
                documentType: "OTHER"
            }
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("Manual Document Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
