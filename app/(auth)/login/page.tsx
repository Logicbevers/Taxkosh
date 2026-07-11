import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { googleAuthEnabled } from "@/lib/auth";

export const metadata = {
    title: "Sign In — TaxKosh",
    description: "Sign in to your TaxKosh account",
};

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm googleEnabled={googleAuthEnabled} />
        </Suspense>
    );
}
