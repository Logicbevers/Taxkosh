import { z } from "zod";

// Shared field validators reused by signup + the KYC/profile form.
export const panSchema = z
    .string()
    .regex(/^[A-Za-z]{3}[ABCFGHLJPTFabcfghljptf]{1}[A-Za-z]{1}[0-9]{4}[A-Za-z]{1}$/, "Invalid PAN format (e.g. ABCPF1234F)");

export const gstinSchema = z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format");

export const aadhaarLast4Schema = z
    .string()
    .regex(/^[0-9]{4}$/, "Enter the last 4 digits of Aadhaar");

export const phoneSchema = z
    .string()
    .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number");

// ─── Register ──────────────────────────────────────────────
// KYC (PAN / Aadhaar / GSTIN) is intentionally NOT collected here. It's deferred
// to the profile page / first filing so signup stays a fast 4-field form.
export const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
        role: z.enum(["INDIVIDUAL", "BUSINESS", "CA"]),
        terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type RegisterInput = z.infer<typeof registerSchema>;

// ─── KYC / Profile ─────────────────────────────────────────
// All optional — a taxpayer can save partial KYC and complete it later.
export const kycSchema = z.object({
    phone: phoneSchema.optional().or(z.literal("")),
    pan: panSchema.optional().or(z.literal("")),
    aadhaarLast4: aadhaarLast4Schema.optional().or(z.literal("")),
    gstin: gstinSchema.optional().or(z.literal("")),
});

export type KycInput = z.infer<typeof kycSchema>;

// ─── Login ─────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Forgot Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ────────────────────────────────────────
export const resetPasswordSchema = z
    .object({
        token: z.string().min(1),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
