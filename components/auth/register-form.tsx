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
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "INDIVIDUAL", terms: false },
    });

    const role = watch("role");
    const showGstinField = role === "BUSINESS" || role === "CA";

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

        setSuccess(true);
    };

    if (success) {
        return (
            <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm text-center">
                <div className="text-4xl mb-4">📧</div>
                <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    We sent a verification email to your address. Click the link inside to activate your account.
                </p>
                <Button variant="outline" onClick={() => router.push("/login")}>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Join 50,000+ Indian taxpayers on TaxKosh
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

                {/* Indian Compliance Fields */}
                <div className="pt-2 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                        Indian Compliance (Optional)
                    </p>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="reg-pan">PAN Number</Label>
                            <Input
                                id="reg-pan"
                                placeholder="ABCDE1234F"
                                className="uppercase"
                                {...register("pan")}
                            />
                            {errors.pan && <p className="text-xs text-destructive">{errors.pan.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reg-aadhaar">
                                Aadhaar (Last 4 digits only)
                            </Label>
                            <Input
                                id="reg-aadhaar"
                                placeholder="XXXX XXXX XXXX 1234 → enter 1234"
                                maxLength={4}
                                {...register("aadhaarLast4")}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                🔒 We only store the last 4 digits in compliance with UIDAI guidelines
                            </p>
                            {errors.aadhaarLast4 && (
                                <p className="text-xs text-destructive">{errors.aadhaarLast4.message}</p>
                            )}
                        </div>

                        {showGstinField && (
                            <div className="space-y-1.5">
                                <Label htmlFor="reg-gstin">GSTIN</Label>
                                <Input
                                    id="reg-gstin"
                                    placeholder="27AABCT1234A1Z5"
                                    className="uppercase"
                                    {...register("gstin")}
                                />
                                {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                            </div>
                        )}
                    </div>
                </div>

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

            <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
        </div>
    );
}
