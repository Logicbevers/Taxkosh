import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ServicesNotFound() {
    return (
        <div className="mx-auto max-w-md text-center px-4 py-16">
            <h1 className="text-3xl font-bold mb-3">Service not found</h1>
            <p className="text-muted-foreground mb-8">
                The service or category you&apos;re looking for is no longer available. It may have been renamed or removed.
            </p>
            <Button asChild>
                <Link href="/services">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to all services
                </Link>
            </Button>
        </div>
    );
}
