import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// These variables should be placed in your .env or .env.local file
const s3Region = process.env.AWS_REGION || "ap-south-1";
const s3Bucket = process.env.AWS_S3_BUCKET_NAME || "taxkosh-secure-docs-bucket";

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

    const command = new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        ServerSideEncryption: "AES256", // Optional, strictly enforce SSE-S3 encryption
    });

    await s3Client.send(command);

    return s3Key;
}

export async function generateSignedViewUrl(s3Key: string, expiresInSecs = 300) {
    const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
    });

    // URL expires in 300 seconds (5 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSecs });
    return signedUrl;
}
