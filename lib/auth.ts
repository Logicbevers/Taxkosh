import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                });

                if (!user || !user.password) return null;

                // Block unverified email users (OAuth users have emailVerified set automatically)
                // In development, skip email verification so local testing works without a real SMTP setup
                if (!user.emailVerified && process.env.NODE_ENV === "production") return null;

                const passwordMatch = await bcrypt.compare(
                    parsed.data.password,
                    user.password
                );
                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // On sign-in, enrich token with role + id
            if (user) {
                token.id = user.id;
                token.role = (user as { role: UserRole }).role;
            }
            // Support session update
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
            }
            return session;
        },
        async signIn({ user, account }) {
            // Allow OAuth users through without email verification
            if (account?.provider !== "credentials") return true;
            // Credentials: ensure email is verified (handled in authorize above)
            return true;
        },
    },
    events: {
        // Log sign-in events for audit trail
        async signIn({ user, account, profile }) {
            console.log(`[AUTH-EVENT] Logging LOGIN for ${user.email}`);
            const { logAudit } = await import("@/lib/prisma");
            const { AuditAction } = await import("@prisma/client");
            await logAudit({
                userId: user.id,
                action: AuditAction.LOGIN,
                details: { provider: account?.provider }
            });
        },
        // When a new OAuth user is created, mark email as verified
        async createUser({ user }) {
            if (user.email) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: new Date() },
                });
            }
        },
    },
});
