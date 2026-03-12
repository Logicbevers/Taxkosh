import { FileText } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl mb-8"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <FileText className="h-4 w-4" />
                </span>
                Tax<span className="text-primary">Kosh</span>
            </Link>
            <div className="w-full max-w-md">{children}</div>
            <p className="mt-8 text-xs text-muted-foreground text-center">
                © {new Date().getFullYear()} TaxKosh Technologies Pvt. Ltd. &nbsp;·&nbsp;{" "}
                <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
                &nbsp;·&nbsp;
                <Link href="/terms" className="hover:underline">Terms</Link>
            </p>
        </div>
    );
}
