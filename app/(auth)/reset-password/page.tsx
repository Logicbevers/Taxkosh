"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { token },
    });

    const onSubmit = async (data: ResetPasswordInput) => {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        setIsLoading(false);
        if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
    };

    if (!token) return (
        <Alert variant="destructive"><AlertDescription>Invalid reset link. Please request a new one.</AlertDescription></Alert>
    );

    return (
        <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Set new password</h1>
            <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>

            {success ? (
                <Alert className="border-emerald-500/30 bg-emerald-500/5">
                    <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                        ✅ Password updated! Redirecting to login…
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <input type="hidden" {...register("token")} />
                        <div className="space-y-1.5">
                            <Label htmlFor="reset-password">New Password</Label>
                            <Input id="reset-password" type="password" placeholder="Min 8 chars" {...register("password")} />
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="reset-confirm">Confirm Password</Label>
                            <Input id="reset-confirm" type="password" placeholder="••••••••" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return <Suspense><ResetPasswordForm /></Suspense>;
}
