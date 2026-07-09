import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { encrypt } from "@/lib/security";

const rowSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email(),
    phone: z.string().optional(),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/).optional(),
    gstin: z.string().optional(),
    role: z.enum(["INDIVIDUAL", "BUSINESS", "CA"]).default("INDIVIDUAL"),
});

const bodySchema = z.object({
    rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { rows } = parsed.data;

    // Temporary password for imported users — they must reset via forgot-password
    const tempPasswordHash = await bcrypt.hash("TaxKosh@ChangeMe1", 12);

    const results: Array<{ email: string; status: "created" | "skipped" | "error"; reason?: string }> = [];
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
        try {
            const existing = await prisma.user.findUnique({ where: { email: row.email } });
            if (existing) {
                results.push({ email: row.email, status: "skipped", reason: "Account already exists" });
                skipped++;
                continue;
            }

            await prisma.user.create({
                data: {
                    name: row.name,
                    email: row.email,
                    password: tempPasswordHash,
                    role: row.role as UserRole,
                    phone: row.phone ?? null,
                    pan: row.pan ? encrypt(row.pan) : null,
                    gstin: row.gstin ?? null,
                    // Imported accounts start unverified — user must verify via email link
                    emailVerified: null,
                },
            });

            results.push({ email: row.email, status: "created" });
            created++;
        } catch (err) {
            results.push({ email: row.email, status: "error", reason: err instanceof Error ? err.message : "Unknown error" });
        }
    }

    return NextResponse.json({ results, created, skipped, errors: results.filter(r => r.status === "error").length });
}
