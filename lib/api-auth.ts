/**
 * Shared authentication & authorization helpers for API routes.
 * Use these instead of inlining `auth()` + role checks in every handler.
 */

import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

export type ApiGuardResult =
    | { ok: true; session: Session & { user: NonNullable<Session["user"]> & { id: string; role: UserRole } } }
    | { ok: false; response: NextResponse };

/** Require any authenticated user. */
export async function requireAuth(): Promise<ApiGuardResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { ok: true, session: session as ApiGuardResult extends { ok: true; session: infer S } ? S : never };
}

/** Require an admin user. Returns 403 if not admin. */
export async function requireAdmin(): Promise<ApiGuardResult> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
        return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true, session: session as ApiGuardResult extends { ok: true; session: infer S } ? S : never };
}

/** Extract client IP from forwarded headers with consistent fallback. */
export function getClientIp(req: Request): string {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
