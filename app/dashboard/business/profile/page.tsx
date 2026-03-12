"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building2, CheckCircle2 } from "lucide-react";

const profileSchema = z.object({
    gstin: z.string().length(15, "GSTIN must be exactly 15 characters").toUpperCase(),
    legalName: z.string().min(2, "Legal name is required"),
    tradeName: z.string().optional(),
    address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function BusinessProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            gstin: "",
            legalName: "",
            tradeName: "",
            address: "",
        }
    });

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/gst/profile");
                if (res.ok) {
                    const { profile } = await res.json();
                    if (profile) {
                        reset({
                            gstin: profile.gstin,
                            legalName: profile.legalName,
                            tradeName: profile.tradeName || "",
                            address: profile.address || "",
                        });
                    }
                }
            } finally {
                setIsLoading(false);
            }
        }
        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSaving(true);
        setSuccessMessage("");
        try {
            const res = await fetch("/api/gst/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setSuccessMessage("Business profile updated successfully!");
                setTimeout(() => setSuccessMessage(""), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Business Options</h1>
                <p className="text-muted-foreground">Manage your GST details and business information.</p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">GST Configuration</h2>
                            <p className="text-sm text-muted-foreground">Required for GSTR-1 & GSTR-3B filings</p>
                        </div>
                    </div>
                    {successMessage && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="h-4 w-4" />
                            {successMessage}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="gstin">GSTIN Number <span className="text-red-500">*</span></Label>
                            <Input id="gstin" placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} className="uppercase" {...register("gstin")} />
                            {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="legalName">Legal Name <span className="text-red-500">*</span></Label>
                            <Input id="legalName" placeholder="As per PAN" {...register("legalName")} />
                            {errors.legalName && <p className="text-xs text-destructive">{errors.legalName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tradeName">Trade Name (Optional)</Label>
                            <Input id="tradeName" placeholder="Doing business as..." {...register("tradeName")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Registered Business Address</Label>
                        <Input id="address" placeholder="Full address" {...register("address")} />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaving ? "Saving..." : "Save Business Profile"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
