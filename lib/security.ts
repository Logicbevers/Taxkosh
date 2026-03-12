import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "fallback_key_at_least_32_characters_long_123";

/**
 * Masks a PAN number (e.g., ABCDE1234F -> ABCDE****F)
 */
export function maskPAN(pan: string | null | undefined): string {
    if (!pan) return "Not Provided";
    if (pan.length !== 10) return pan;
    return `${pan.slice(0, 5)}****${pan.slice(9)}`;
}

/**
 * Masks an Aadhaar number (e.g., 123456789012 -> ********9012)
 */
export function maskAadhaar(aadhaar: string | null | undefined): string {
    if (!aadhaar) return "Not Provided";
    // Only last 4 should be stored/visible per UIDAI guidelines
    if (aadhaar.length <= 4) return aadhaar;
    return `********${aadhaar.slice(-4)}`;
}

/**
 * Masks a Phone number (e.g., 9876543210 -> ******3210)
 */
export function maskPhone(phone: string | null | undefined): string {
    if (!phone) return "Not Provided";
    if (phone.length < 6) return phone;
    return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

/**
 * Encrypts sensitive data using AES-256-GCM
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: iv:authTag:encryptedText
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts sensitive data using AES-256-GCM
 */
export function decrypt(encryptedData: string): string {
    try {
        const [ivHex, authTagHex, encryptedText] = encryptedData.split(":");

        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        return "[ENCRYPTED]";
    }
}
