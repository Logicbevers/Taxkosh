"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function ForgotPasswordPage() {
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        setIsLoading(false);
        if (!res.ok) { setError("Something went wrong. Please try again."); return; }
        setSuccess(true);
    };

    return (
        <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we&apos;ll send a reset link.
            </p>

            {success ? (
                <Alert className="border-emerald-500/30 bg-emerald-500/5">
                    <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                        📧 If this email is registered, you&apos;ll receive a reset link shortly.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input id="forgot-email" type="email" placeholder="you@example.com" {...register("email")} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                        </Button>
                    </form>
                </>
            )}
        </div>
    );
}
