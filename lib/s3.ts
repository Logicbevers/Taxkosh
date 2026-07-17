import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

const s3Region = process.env.AWS_REGION ?? "ap-south-1";

/**
 * True when real S3 credentials/bucket are configured. When false (typical in
 * local dev), uploads/reads transparently fall back to on-disk storage under
 * `.local-uploads/` so document flows work end-to-end without AWS.
 */
export const S3_CONFIGURED = Boolean(process.env.AWS_S3_BUCKET_NAME);

// On serverless hosts (Vercel/Lambda) the deploy directory is read-only — only
// /tmp is writable, and it is EPHEMERAL (files vanish between invocations).
// The local fallback is a dev/demo convenience; production should set the AWS
// env vars so uploads persist in S3.
const LOCAL_ROOT = process.env.VERCEL
    ? path.join("/tmp", "taxkosh-uploads")
    : path.join(process.cwd(), ".local-uploads");

// Resolve an s3Key to a local path, guarding against path traversal.
//
// The old approach — stripping "../" with a single regex pass — was bypassable:
// "....//" collapses back to "../" after one non-recursive replace. Instead we
// resolve the full path and require it to stay inside LOCAL_ROOT, which no crafted
// key (traversal, absolute, symlink-free) can escape.
function localPathForKey(s3Key: string): string {
    const resolved = path.resolve(LOCAL_ROOT, s3Key);
    const root = path.resolve(LOCAL_ROOT);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        throw new Error("Invalid storage key");
    }
    return resolved;
}

/** Read a locally-stored object (dev fallback). */
export async function readLocalObject(s3Key: string): Promise<Buffer> {
    return fs.readFile(localPathForKey(s3Key));
}

function getS3Bucket(): string {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    if (!bucket) throw new Error("AWS_S3_BUCKET_NAME env var must be set");
    return bucket;
}

// Standard S3 Client initialization. 
// Uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY automatically if available in the environment.
export const s3Client = new S3Client({
    region: s3Region,
    // If not using standard AWS ENV vars, uncomment and provide them explicitly:
    /*
    credentials: {
       accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    }
    */
});

export async function uploadToS3(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const s3Key = `uploads/${timestamp}_${safeFileName}`;

    // Dev fallback: persist to local disk when S3 isn't configured so the
    // document upload flow works end-to-end without AWS.
    if (!S3_CONFIGURED) {
        const dest = localPathForKey(s3Key);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, fileBuffer);
        return s3Key;
    }

    const command = new PutObjectCommand({
        Bucket: getS3Bucket(),
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: "AES256", // Optional, strictly enforce SSE-S3 encryption
    });

    await s3Client.send(command);

    return s3Key;
}

export async function generateSignedViewUrl(s3Key: string, expiresInSecs = 300) {
    if (!S3_CONFIGURED) {
        // Dev fallback served by the document view route.
        return `/api/documents/view?key=${encodeURIComponent(s3Key)}`;
    }

    const command = new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: s3Key,
    });

    // URL expires in 300 seconds (5 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSecs });
    return signedUrl;
}
