import { z } from "zod";

// ─── Register ──────────────────────────────────────────────
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
        role: z.enum(["INDIVIDUAL", "BUSINESS", "CA", "ADMIN"]),
        // Indian compliance — optional
        pan: z
            .string()
            .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format (e.g. ABCDE1234F)")
            .optional()
            .or(z.literal("")),
        gstin: z
            .string()
            .regex(
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                "Invalid GSTIN format"
            )
            .optional()
            .or(z.literal("")),
        aadhaarLast4: z
            .string()
            .regex(/^[0-9]{4}$/, "Enter last 4 digits of Aadhaar")
            .optional()
            .or(z.literal("")),
        terms: z.boolean().refine((v) => v === true, "You must accept the terms"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type RegisterInput = z.infer<typeof registerSchema>;

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
