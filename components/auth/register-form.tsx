"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { registerSchema, type RegisterInput } from "@/lib/validations";

const ROLES = [
    { value: "INDIVIDUAL", label: "Individual Taxpayer" },
    { value: "BUSINESS", label: "Business Owner" },
    { value: "CA", label: "Chartered Accountant" },
];

export function RegisterForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [autoVerified, setAutoVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "INDIVIDUAL", terms: false },
    });

    const onSubmit = async (data: RegisterInput) => {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const json = await res.json();
        setIsLoading(false);

        if (!res.ok) {
            setError(json.error ?? "Something went wrong. Please try again.");
            return;
        }

        setAutoVerified(Boolean(json.autoVerified));
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="text-4xl mb-4">{autoVerified ? "🎉" : "📧"}</div>
                <h2 className="font-serif text-2xl mb-2">
                    {autoVerified ? "You're all set" : "Check your inbox"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                    {autoVerified
                        ? "Your account is ready — log in to start your first filing."
                        : "We sent a verification email to your address. Click the link inside to activate your account."}
                </p>
                <Button variant="outline" onClick={() => router.push("/login")}>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div>
            <AuthTabs active="signup" />

            <div className="mb-7">
                <h1 className="font-serif text-3xl text-foreground">Create your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Start filing your taxes in minutes.
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input id="reg-name" placeholder="Priya Sharma" {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" placeholder="you@example.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                    <Label htmlFor="reg-role">I am a</Label>
                    <Select
                        defaultValue="INDIVIDUAL"
                        onValueChange={(v) => setValue("role", v as RegisterInput["role"])}
                    >
                        <SelectTrigger id="reg-role">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                        <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min 8 chars, 1 uppercase, 1 number"
                            className="pr-10"
                            autoComplete="new-password"
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <p className="text-[11px] text-muted-foreground -mt-1">
                    🔒 You can add your PAN &amp; GST details later from your profile — no KYC needed to sign up.
                </p>

                {/* Terms */}
                <div className="flex items-start gap-2">
                    <input
                        id="reg-terms"
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary"
                        {...register("terms")}
                    />
                    <label htmlFor="reg-terms" className="text-xs text-muted-foreground">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                    </label>
                </div>
                {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

                <Button type="submit" className="w-full" disabled={isLoading} id="register-submit-btn">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
            </form>

        </div>
    );
}
