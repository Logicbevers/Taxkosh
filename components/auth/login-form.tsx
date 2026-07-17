"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Default to the home page so users land on the browsable site, not the
    // dashboard. Deep-links (e.g. "Choose plan" → ?callbackUrl=/services/…) still win.
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";
    const isVerified = searchParams.get("verified") === "true";
    const errorParam = searchParams.get("error");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(
        errorParam === "MissingCSRF"
            ? "Session expired. Please try again."
            : errorParam === "CredentialsSignin"
                ? "Invalid email or password."
                : errorParam === "AccessDenied"
                    ? "Your email is not verified. Check your inbox."
                    : errorParam && errorParam !== "invalid-token"
                        ? "Sign-in failed: " + errorParam
                        : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        setError(null);

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        setIsLoading(false);

        if (result?.error) {
            // NextAuth error codes
            if (result.error === "CredentialsSignin") {
                setError("Invalid email or password. Please check your credentials and try again.");
            } else if (result.error === "AccessDenied") {
                setError("Your account email is not yet verified. Please check your inbox for the verification link.");
            } else {
                setError("Sign-in failed. Please try again or reset your password.");
            }
            return;
        }

        router.push(callbackUrl);
        router.refresh();
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        await signIn("google", { callbackUrl });
    };

    return (
        <div>
            <AuthTabs active="login" />

            <div className="mb-7">
                <h1 className="font-serif text-3xl text-foreground">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Log in to continue your filing.
                </p>
            </div>

            {/* Status alerts */}
            {isVerified && (
                <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
                    <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                        ✅ Email verified! You can now log in.
                    </AlertDescription>
                </Alert>
            )}
            {errorParam === "invalid-token" && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>Invalid or expired verification link.</AlertDescription>
                </Alert>
            )}
            {errorParam === "MissingCSRF" && !error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>Security check failed. Please refresh the page and try again.</AlertDescription>
                </Alert>
            )}
            {errorParam === "CredentialsSignin" && !error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>Invalid email or password. Please check your credentials and try again.</AlertDescription>
                </Alert>
            )}
            {errorParam === "AccessDenied" && !error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>Your account email is not yet verified.</AlertDescription>
                </Alert>
            )}
            {errorParam === "Configuration" && !error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>Server configuration error. Check NEXTAUTH_URL / AUTH_SECRET in .env.</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Google — hidden entirely when OAuth isn't configured */}
            {googleEnabled && (
                <>
                    <Button
                        variant="outline"
                        className="w-full mb-4 gap-2"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        id="google-signin-btn"
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Chrome className="h-4 w-4" />
                        )}
                        Continue with Google
                    </Button>

                    <div className="flex items-center gap-3 mb-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">or</span>
                        <Separator className="flex-1" />
                    </div>
                </>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pr-10"
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    id="login-submit-btn"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
            </form>

            {/* Always visible, not gated on an error: authorize() returns null for an
                unverified user, which next-auth reports as CredentialsSignin — identical
                to a wrong password. So we can't detect the case to offer this at the right
                moment, and a stuck user is told only "Invalid email or password". */}
            <p className="text-center text-xs text-muted-foreground mt-5">
                Didn&apos;t receive a verification email?{" "}
                <Link href="/resend-verification" className="text-primary hover:underline">
                    Resend it
                </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground mt-6">
                By continuing you agree to TaxKosh&apos;s{" "}
                <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
        </div>
    );
}
