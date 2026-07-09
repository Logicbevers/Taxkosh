"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface PhoneOTPDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerified: () => void;
}

type Step = "phone" | "otp";

export function PhoneOTPDialog({ open, onOpenChange, onVerified }: PhoneOTPDialogProps) {
    const [step, setStep] = useState<Step>("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    async function sendOTP() {
        if (!/^[6-9]\d{9}$/.test(phone)) {
            toast.error("Enter a valid 10-digit Indian mobile number");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/phone/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? "Failed to send OTP");
                return;
            }
            toast.success(data.message);
            if (data.devOtp) {
                toast.info(`Dev mode — OTP: ${data.devOtp}`, { duration: 30000 });
            }
            setStep("otp");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function verifyOTP() {
        if (otp.length !== 6) {
            toast.error("Enter the 6-digit OTP");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/phone/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code: otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? "Verification failed");
                return;
            }
            toast.success("Phone number verified!");
            onVerified();
            onOpenChange(false);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleClose(open: boolean) {
        if (!open) {
            setStep("phone");
            setPhone("");
            setOtp("");
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === "phone" ? (
                            <><Phone className="w-4 h-4" /> Verify your phone number</>
                        ) : (
                            <><ShieldCheck className="w-4 h-4" /> Enter the OTP</>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "phone"
                            ? "Required before payment. We'll send a one-time code to your number."
                            : `We sent a 6-digit code to +91 ${phone}. Enter it below.`}
                    </DialogDescription>
                </DialogHeader>

                {step === "phone" ? (
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="phone-input">Mobile number</Label>
                            <div className="flex gap-2">
                                <span className="flex items-center px-3 border rounded-md bg-muted text-sm text-muted-foreground">
                                    +91
                                </span>
                                <Input
                                    id="phone-input"
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="9XXXXXXXXX"
                                    maxLength={10}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                    onKeyDown={(e) => e.key === "Enter" && !loading && sendOTP()}
                                />
                            </div>
                        </div>
                        <Button className="w-full" onClick={sendOTP} disabled={loading}>
                            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send OTP"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="otp-input">6-digit OTP</Label>
                            <Input
                                id="otp-input"
                                type="text"
                                inputMode="numeric"
                                placeholder="123456"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                onKeyDown={(e) => e.key === "Enter" && !loading && verifyOTP()}
                                className="tracking-widest text-center text-lg font-mono"
                            />
                        </div>
                        <Button className="w-full" onClick={verifyOTP} disabled={loading}>
                            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : "Verify OTP"}
                        </Button>
                        <button
                            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => { setStep("phone"); setOtp(""); }}
                        >
                            Change number
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
