"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneOTPDialog } from "@/components/phone-otp-dialog";
import { CheckoutButton } from "@/components/services/CheckoutButton";
import {
    Check,
    Upload,
    Loader2,
    Phone,
    ShieldCheck,
    FileText,
    AlertCircle,
    Lock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ServicePurchaseFlowProps {
    serviceId: string;
    serviceName: string;
    price: number;
    requiredDocuments: string[];
    isSignedIn: boolean;
    returnPath: string;
    autoCheckout?: boolean;
    /**
     * Only gate payment on phone verification when an SMS gateway is
     * configured — without one, real users can never receive the OTP and the
     * funnel would dead-end (the server passes isSmsConfigured() here).
     */
    requirePhoneVerification?: boolean;
}

interface DocState {
    label: string;
    uploading: boolean;
    uploaded: boolean;
    fileName?: string;
    /**
     * Id returned by /api/documents/upload. These uploads happen before the service
     * request exists, so checkout passes the ids back to attach exactly them —
     * see linkDocumentsToRequest.
     */
    documentId?: string;
}

export function ServicePurchaseFlow({
    serviceId,
    serviceName,
    price,
    requiredDocuments,
    isSignedIn,
    returnPath,
    autoCheckout,
    requirePhoneVerification = false,
}: ServicePurchaseFlowProps) {
    const [docs, setDocs] = useState<DocState[]>(
        requiredDocuments.map((label) => ({ label, uploading: false, uploaded: false }))
    );
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneLoading, setPhoneLoading] = useState(isSignedIn && requirePhoneVerification);
    const [otpOpen, setOtpOpen] = useState(false);
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Fetch phone verification status on mount (only when the step is active)
    useEffect(() => {
        if (!isSignedIn || !requirePhoneVerification) return;
        fetch("/api/auth/phone/status")
            .then((r) => r.json())
            .then((d) => setPhoneVerified(d.phoneVerified ?? false))
            .catch(() => {})
            .finally(() => setPhoneLoading(false));
    }, [isSignedIn, requirePhoneVerification]);

    const allDocsUploaded = docs.every((d) => d.uploaded);
    const canProceed = allDocsUploaded && (phoneVerified || !requirePhoneVerification);

    async function handleFileChange(index: number, file: File | null) {
        if (!file) return;

        setDocs((prev) =>
            prev.map((d, i) => (i === index ? { ...d, uploading: true } : d))
        );

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("documentType", "OTHER");
            formData.append("label", docs[index].label);

            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "Upload failed");
                setDocs((prev) =>
                    prev.map((d, i) => (i === index ? { ...d, uploading: false } : d))
                );
                return;
            }

            setDocs((prev) =>
                prev.map((d, i) =>
                    i === index
                        ? { ...d, uploading: false, uploaded: true, fileName: file.name, documentId: data.document?.id }
                        : d
                )
            );
            toast.success(`${docs[index].label} uploaded`);
        } catch {
            toast.error("Upload failed. Please try again.");
            setDocs((prev) =>
                prev.map((d, i) => (i === index ? { ...d, uploading: false } : d))
            );
        }
    }

    const loginCallback = `/login?callbackUrl=${encodeURIComponent(returnPath)}`;

    return (
        <div className="space-y-6">
            {/* Price header */}
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Service fee</p>
                <div className="flex items-baseline gap-2">
                    <span className="font-serif text-5xl text-foreground">
                        ₹{price > 0 ? price.toLocaleString("en-IN") : "—"}
                    </span>
                    {price > 0 && <span className="text-sm text-muted-foreground">one-time</span>}
                </div>
                {price === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">Pricing not yet set — contact us.</p>
                )}
            </div>

            {!isSignedIn ? (
                /* Guest CTA */
                <Card className="border-2 border-primary/30">
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Sign in to upload documents and proceed to payment.
                        </p>
                        <Button asChild className="w-full">
                            <Link href={loginCallback}>Sign in to get started</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Step 1 — Documents */}
                    {requiredDocuments.length > 0 && (
                        <Card className={allDocsUploaded ? "border-emerald-500/50" : "border-border"}>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Step 1 — Upload documents
                                </h3>
                                {allDocsUploaded && (
                                    <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
                                        <Check className="w-3 h-3 mr-1" /> Complete
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {docs.map((doc, i) => (
                                    <div
                                        key={doc.label}
                                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                                    >
                                        <div className="shrink-0">
                                            {doc.uploaded ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : doc.uploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{doc.label}</p>
                                            {doc.fileName && (
                                                <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            {doc.uploaded ? (
                                                <button
                                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    onClick={() => fileRefs.current[i]?.click()}
                                                >
                                                    Replace
                                                </button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={doc.uploading}
                                                    onClick={() => fileRefs.current[i]?.click()}
                                                    className="h-7 text-xs"
                                                >
                                                    {doc.uploading ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <><Upload className="w-3 h-3 mr-1" />Upload</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            ref={(el) => { fileRefs.current[i] = el; }}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={(e) => handleFileChange(i, e.target.files?.[0] ?? null)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2 — Phone verification (hidden until an SMS gateway exists) */}
                    {requirePhoneVerification && (
                    <Card className={phoneVerified ? "border-emerald-500/50" : "border-border"}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="shrink-0">
                                {phoneLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                ) : phoneVerified ? (
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Phone className="w-5 h-5 text-amber-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {requiredDocuments.length > 0 ? "Step 2 — " : ""}Phone verification
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {phoneVerified
                                        ? "Your phone number is verified"
                                        : "Verify your mobile number via OTP"}
                                </p>
                            </div>
                            {!phoneLoading && !phoneVerified && (
                                <Button size="sm" variant="outline" onClick={() => setOtpOpen(true)} className="shrink-0">
                                    Verify
                                </Button>
                            )}
                            {phoneVerified && (
                                <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 shrink-0">
                                    <Check className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                    )}

                    {/* Payment CTA */}
                    <div className="space-y-2">
                        {canProceed ? (
                            <CheckoutButton
                                serviceId={serviceId}
                                title={serviceName}
                                amount={price * 100}
                                autoCheckout={autoCheckout}
                                documentIds={docs.map((d) => d.documentId).filter((id): id is string => Boolean(id))}
                            />
                        ) : (
                            <Button
                                className="w-full h-11 rounded-2xl opacity-60 cursor-not-allowed"
                                disabled
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                {!allDocsUploaded && requiredDocuments.length > 0
                                    ? "Upload all documents to continue"
                                    : "Verify phone to continue"}
                            </Button>
                        )}
                        <p className="text-[11px] text-center text-muted-foreground">
                            {canProceed
                                ? "All checks passed — click to pay securely via Razorpay."
                                : "Complete the steps above to unlock payment."}
                        </p>
                    </div>
                </>
            )}

            <PhoneOTPDialog
                open={otpOpen}
                onOpenChange={setOtpOpen}
                onVerified={() => setPhoneVerified(true)}
            />
        </div>
    );
}
