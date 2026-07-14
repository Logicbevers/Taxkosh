/**
 * Upload malware scanning.
 *
 * Real scanning runs through Cloudmersive's hosted virus-scan API (works on
 * serverless / Vercel — no binary to ship). When no CLOUDMERSIVE_API_KEY is
 * configured, we fall back to a lightweight local heuristic: reject the EICAR
 * test signature and validate that a file's magic bytes match its declared
 * MIME type (a common malware-delivery trick is a mislabelled extension).
 *
 * Availability policy: if a configured scanner errors or times out, we fall
 * back to the heuristic rather than blocking every upload — documents are only
 * ever downloaded (never executed) and stored in S3, so a scanner outage
 * shouldn't take the whole upload path down. The degradation is logged.
 */

// EICAR anti-malware test string — the industry-standard harmless "virus" used
// to prove a scanner is wired up. Kept split so this source file itself doesn't
// trip naive scanners.
const EICAR =
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-" + "STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

const PLACEHOLDER = /your|placeholder|example|<|>/i;
const CLOUDMERSIVE_ENDPOINT = "https://api.cloudmersive.com/virus/scan/file";
const SCAN_TIMEOUT_MS = 15_000;

function cloudmersiveKey(): string | null {
    const key = process.env.CLOUDMERSIVE_API_KEY?.trim();
    return key && !PLACEHOLDER.test(key) ? key : null;
}

/** True when a real hosted scanner is configured. */
export function isVirusScanConfigured(): boolean {
    return cloudmersiveKey() !== null;
}

export interface ScanResult {
    clean: boolean;
    engine: "cloudmersive" | "heuristic";
    /** Human-readable reason when not clean (or degraded). */
    reason?: string;
}

/**
 * Validate that a buffer's leading bytes match its declared MIME type. Returns
 * false on a mismatch (e.g. an .exe renamed to .pdf). Unknown types pass — the
 * caller's allow-list is the gate for which types are accepted at all.
 */
export function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const b = buffer;
    switch (mimeType) {
        case "application/pdf":
            return b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
        case "image/jpeg":
            return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
        case "image/png":
            return (
                b.length >= 8 &&
                b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
                b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
            );
        case "image/webp":
            return (
                b.length >= 12 &&
                b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
                b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50   // WEBP
            );
        default:
            return true;
    }
}

function heuristicScan(buffer: Buffer): ScanResult {
    if (buffer.includes(Buffer.from(EICAR, "latin1"))) {
        return { clean: false, engine: "heuristic", reason: "EICAR test signature detected" };
    }
    return { clean: true, engine: "heuristic" };
}

async function scanWithCloudmersive(buffer: Buffer, filename: string, apiKey: string): Promise<ScanResult> {
    const form = new FormData();
    form.append("inputFile", new Blob([new Uint8Array(buffer)]), filename || "upload");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
    try {
        const res = await fetch(CLOUDMERSIVE_ENDPOINT, {
            method: "POST",
            headers: { Apikey: apiKey },
            body: form,
            signal: controller.signal,
        });
        if (!res.ok) {
            throw new Error(`Cloudmersive responded HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
            CleanResult?: boolean;
            FoundViruses?: { VirusName?: string }[] | null;
        };
        if (data.CleanResult === true) {
            return { clean: true, engine: "cloudmersive" };
        }
        const virus = data.FoundViruses?.[0]?.VirusName;
        return {
            clean: false,
            engine: "cloudmersive",
            reason: virus ? `Malware detected: ${virus}` : "File failed virus scan",
        };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Scan an uploaded file. Uses Cloudmersive when configured; otherwise the local
 * heuristic. A configured-scanner error degrades to the heuristic (logged) so
 * uploads keep working during a provider outage.
 */
export async function scanBuffer(buffer: Buffer, filename: string): Promise<ScanResult> {
    const key = cloudmersiveKey();
    if (!key) return heuristicScan(buffer);

    try {
        return await scanWithCloudmersive(buffer, filename, key);
    } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        console.error("Virus scan degraded to heuristic:", aborted ? "timeout" : err);
        // Fail open to the heuristic (still catches EICAR / obvious junk).
        return { ...heuristicScan(buffer), reason: "scanner unavailable — heuristic used" };
    }
}
