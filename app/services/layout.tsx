import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";

export const dynamic = "force-dynamic";

export default function PublicServicesLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <main className="pt-24 pb-16 min-h-screen">{children}</main>
            <Footer />
        </>
    );
}
