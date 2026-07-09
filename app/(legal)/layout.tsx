import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main className="pt-28 pb-20 min-h-screen">
                <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_ul]:space-y-1 [&_ul]:mb-4 [&_a]:text-primary [&_a]:hover:underline [&_strong]:text-foreground">
                    {children}
                </article>
            </main>
            <Footer />
        </>
    );
}
