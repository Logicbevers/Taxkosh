import { LegalHeader } from "@/components/legal-header";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata = { title: "Contact Us — TaxKosh" };

export default function ContactPage() {
    return (
        <>
            <LegalHeader title="Contact Us" updated="1 July 2026" />

            <p>
                We&apos;re here to help with any question about your filing, payment, or account. Reach out through
                any of the channels below and our support team will respond within 1 business day.
            </p>

            <div className="not-prose grid gap-4 sm:grid-cols-2 my-8">
                <div className="rounded-xl border p-5">
                    <Mail className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-foreground">Email</p>
                    <a href="mailto:support@taxkosh.in" className="text-sm text-primary hover:underline">support@taxkosh.in</a>
                </div>
                <div className="rounded-xl border p-5">
                    <Phone className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-foreground">Phone</p>
                    <a href="tel:+911140000000" className="text-sm text-primary hover:underline">+91 11 4000 0000</a>
                </div>
                <div className="rounded-xl border p-5">
                    <MapPin className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-foreground">Registered Office</p>
                    <p className="text-sm text-muted-foreground">TaxKosh Technologies Pvt. Ltd.<br />New Delhi, India</p>
                </div>
                <div className="rounded-xl border p-5">
                    <Clock className="w-5 h-5 text-primary mb-2" />
                    <p className="font-semibold text-foreground">Support Hours</p>
                    <p className="text-sm text-muted-foreground">Mon–Sat, 10:00–19:00 IST</p>
                </div>
            </div>

            <h2>Grievance Officer</h2>
            <p>
                In accordance with applicable law, complaints regarding data handling or service may be addressed
                to our Grievance Officer at <a href="mailto:grievance@taxkosh.in">grievance@taxkosh.in</a>. We
                acknowledge grievances within 48 hours and aim to resolve them within 30 days.
            </p>
        </>
    );
}
