"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { kycSchema, type KycInput } from "@/lib/validations";

interface Props {
    /** Current values so the user sees what's already on file */
    initial: {
        phone: string | null;
        panMasked: string; // already masked; we never prefill the raw PAN
        hasPan: boolean;
        aadhaarLast4: string | null;
        gstin: string | null;
    };
    showBusinessFields: boolean;
}

export function KycForm({ initial, showBusinessFields }: Props) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<KycInput>({
        resolver: zodResolver(kycSchema),
        defaultValues: {
            phone: initial.phone ?? "",
            pan: "",
            aadhaarLast4: initial.aadhaarLast4 ?? "",
            gstin: initial.gstin ?? "",
        },
    });

    const onSubmit = async (data: KycInput) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json.error ?? "Could not save your details");
                return;
            }
            toast.success("Tax profile updated");
            router.refresh();
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Tax Profile (KYC)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Required to file returns. Your PAN is encrypted at rest — we only ever display it masked.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="kyc-phone">Mobile number</Label>
                        <Input id="kyc-phone" placeholder="9876543210" maxLength={10} {...register("phone")} />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="kyc-pan">PAN {initial.hasPan && <span className="text-muted-foreground font-normal">· on file: {initial.panMasked}</span>}</Label>
                        <Input id="kyc-pan" placeholder={initial.hasPan ? "Enter to replace" : "ABCPF1234F"} className="uppercase" {...register("pan")} />
                        {errors.pan && <p className="text-xs text-destructive">{errors.pan.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="kyc-aadhaar">Aadhaar (last 4 digits)</Label>
                        <Input id="kyc-aadhaar" placeholder="1234" maxLength={4} {...register("aadhaarLast4")} />
                        <p className="text-[11px] text-muted-foreground">🔒 We only store the last 4 digits, per UIDAI guidance.</p>
                        {errors.aadhaarLast4 && <p className="text-xs text-destructive">{errors.aadhaarLast4.message}</p>}
                    </div>

                    {showBusinessFields && (
                        <div className="space-y-1.5">
                            <Label htmlFor="kyc-gstin">GSTIN</Label>
                            <Input id="kyc-gstin" placeholder="27AABCT1234A1Z5" className="uppercase" {...register("gstin")} />
                            {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                        </div>
                    )}

                    <Button type="submit" disabled={isSaving || !isDirty} className="w-full">
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save tax profile"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
