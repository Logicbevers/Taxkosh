import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Check, PlusCircle, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ServiceRequestStatus } from "@prisma/client";

/** Status → pill label + tint, using the brand status tokens. */
const STATUS_TONE: Record<ServiceRequestStatus, { label: string; cls: string }> = {
    CREATED: { label: "Created", cls: "bg-muted text-muted-foreground" },
    PAYMENT_PENDING: { label: "Payment pending", cls: "bg-status-pending/15 text-status-pending" },
    PAID: { label: "Paid", cls: "bg-primary/12 text-primary" },
    DOCUMENTS_PENDING: { label: "Documents pending", cls: "bg-status-pending/15 text-status-pending" },
    DOCUMENTS_SUBMITTED: { label: "Under review", cls: "bg-status-pending/15 text-status-pending" },
    UNDER_PROCESS: { label: "Under review", cls: "bg-status-pending/15 text-status-pending" },
    CLARIFICATION_REQUIRED: { label: "Needs clarification", cls: "bg-destructive/12 text-destructive" },
    READY_FOR_FILING: { label: "Ready to file", cls: "bg-primary/12 text-primary" },
    FILED: { label: "Filed", cls: "bg-status-healthy/15 text-status-healthy" },
    COMPLETED: { label: "Completed", cls: "bg-status-healthy/15 text-status-healthy" },
    REJECTED: { label: "Rejected", cls: "bg-destructive/12 text-destructive" },
};

const FILING_STEPS = ["Documents uploaded", "CA review", "Filed & acknowledged"];

/** Which step the request is currently on (0-based; 3 = fully done). */
function currentStep(status: ServiceRequestStatus): number {
    switch (status) {
        case "FILED":
        case "COMPLETED":
            return 3;
        case "READY_FOR_FILING":
            return 2;
        case "DOCUMENTS_SUBMITTED":
        case "UNDER_PROCESS":
        case "CLARIFICATION_REQUIRED":
            return 1;
        default:
            return 0;
    }
}

function StatusPill({ status }: { status: ServiceRequestStatus }) {
    const t = STATUS_TONE[status];
    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", t.cls)}>
            {t.label}
        </span>
    );
}

function timeAgo(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days <= 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const requests = await prisma.serviceRequest.findMany({
        where: { userId: session.user.id },
        include: { service: true },
        orderBy: { updatedAt: "desc" },
    });

    const DONE: ServiceRequestStatus[] = ["FILED", "COMPLETED", "REJECTED"];
    const active = requests.find((r) => !DONE.includes(r.status));
    const attention = requests.find((r) =>
        (["DOCUMENTS_PENDING", "CLARIFICATION_REQUIRED", "PAYMENT_PENDING"] as ServiceRequestStatus[]).includes(r.status),
    );

    const firstName = session.user.name?.split(" ")[0] ?? "there";

    return (
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
            {/* Header */}
            <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">Dashboard</p>
                    <h1 className="font-serif text-4xl text-foreground">Welcome back, {firstName}</h1>
                </div>
                <Button href="/dashboard/services" />
            </div>

            {/* Active filing card with step tracker */}
            {active ? (
                <div className="mb-7 rounded-2xl border border-border bg-card p-6">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-base font-bold text-foreground">{active.service?.name ?? "Service request"}</div>
                            <div className="mt-0.5 text-[13px] text-muted-foreground">Started {timeAgo(active.createdAt)}</div>
                        </div>
                        <StatusPill status={active.status} />
                    </div>

                    <ol className="flex items-start">
                        {FILING_STEPS.map((label, i) => {
                            const step = currentStep(active.status);
                            const done = i < step;
                            const isCurrent = i === step;
                            return (
                                <li key={label} className="contents">
                                    <div className="flex flex-1 flex-col items-center gap-2 text-center">
                                        <div
                                            className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold",
                                                done || isCurrent
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground",
                                            )}
                                        >
                                            {done ? <Check className="h-4 w-4" /> : i + 1}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[11px] font-bold",
                                                done || isCurrent ? "text-foreground" : "text-muted-foreground",
                                            )}
                                        >
                                            {label}
                                        </span>
                                    </div>
                                    {i < FILING_STEPS.length - 1 && (
                                        <div className={cn("mt-4 h-0.5 flex-1", i < step ? "bg-primary" : "bg-border")} />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            ) : (
                <div className="mb-7 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No active filing yet.</p>
                    <Link href="/dashboard/services" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">
                        Start your first filing →
                    </Link>
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                {/* Filings table */}
                <div>
                    <p className="mb-3 text-[13px] font-bold text-foreground">My filings</p>
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        {requests.length === 0 ? (
                            <div className="p-10 text-center text-sm text-muted-foreground">No filings yet.</div>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted">
                                        {["Service", "Amount", "Status"].map((h) => (
                                            <th key={h} className="border-b border-border px-4 py-3 text-left text-[11px] font-bold text-muted-foreground">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.slice(0, 8).map((r) => (
                                        <tr key={r.id} className="transition-colors hover:bg-muted/40">
                                            <td className="border-b border-border px-4 py-3.5 text-[13px]">
                                                <Link href={`/dashboard/services/${r.id}`} className="font-semibold hover:text-primary">
                                                    {r.service?.name ?? "Service request"}
                                                </Link>
                                            </td>
                                            <td className="border-b border-border px-4 py-3.5 text-[13px] tabular-nums">
                                                ₹{(r.amount / 100).toLocaleString("en-IN")}
                                            </td>
                                            <td className="border-b border-border px-4 py-3.5">
                                                <StatusPill status={r.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Needs attention */}
                <div>
                    <p className="mb-3 text-[13px] font-bold text-foreground">Needs attention</p>
                    {attention ? (
                        <div className="flex flex-col gap-2.5 rounded-2xl border border-status-pending/25 bg-status-pending/8 p-5">
                            <div className="text-[13px] font-bold text-foreground">
                                {attention.status === "PAYMENT_PENDING" ? "Payment pending" : "Action required"}
                            </div>
                            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                                {attention.status === "CLARIFICATION_REQUIRED"
                                    ? "Your CA needs more information to continue the review."
                                    : attention.status === "PAYMENT_PENDING"
                                        ? "Complete your payment to start this filing."
                                        : "Upload the required documents so your CA can proceed."}
                            </p>
                            <Link href={`/dashboard/services/${attention.id}`} className="text-[12.5px] font-bold text-primary hover:underline">
                                {attention.status === "PAYMENT_PENDING" ? "Complete payment →" : "Upload now →"}
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-card p-5 text-[13px] text-muted-foreground">
                            You&apos;re all caught up — nothing needs your attention.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Primary "New filing" CTA. */
function Button({ href }: { href: string }) {
    return (
        <Link
            href={href}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
            <PlusCircle className="h-4 w-4" /> New filing
        </Link>
    );
}
