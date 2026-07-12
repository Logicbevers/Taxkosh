import { LegalHeader } from "@/components/legal-header";

export const metadata = { title: "Privacy Policy — TaxKosh" };

export default function PrivacyPage() {
    return (
        <>
            <LegalHeader title="Privacy Policy" updated="1 July 2026" />

            <p>
                TaxKosh Technologies Pvt. Ltd. (&quot;TaxKosh&quot;) is committed to protecting your privacy. This policy
                explains what personal and financial data we collect, how we use it, and your rights, in line with
                India&apos;s Digital Personal Data Protection Act, 2023.
            </p>

            <h2>1. Information We Collect</h2>
            <ul>
                <li><strong>Identity data:</strong> name, email, phone, and (where you choose to provide it) PAN, GSTIN, and the last 4 digits of Aadhaar.</li>
                <li><strong>Financial documents:</strong> Form 16, bank statements, invoices, and other files you upload for filing.</li>
                <li><strong>Payment data:</strong> processed by Razorpay; we do not store your card or bank credentials.</li>
                <li><strong>Usage data:</strong> log data, device information, and audit records for security and compliance.</li>
            </ul>

            <h2>2. How We Use Your Data</h2>
            <ul>
                <li>To prepare and file your tax returns and provide the services you request.</li>
                <li>To issue GST-compliant invoices and process payments.</li>
                <li>To communicate service updates and respond to support requests.</li>
                <li>To meet legal, regulatory, and audit obligations.</li>
            </ul>

            <h2>3. Data Security</h2>
            <p>
                Sensitive identifiers such as PAN are encrypted at rest using AES-256-GCM. Documents are stored in
                access-controlled cloud storage with signed, time-limited access URLs. We follow the principle of
                least privilege and maintain audit logs of sensitive-data access.
            </p>

            <h2>4. Data Sharing</h2>
            <p>
                We share data only with (a) sub-processors necessary to deliver the service (e.g., cloud storage,
                email, and payment providers), and (b) tax authorities as required to complete your filing. We do
                not sell your personal data.
            </p>

            <h2>5. Data Retention</h2>
            <p>
                We retain filing records for the period required under the Income Tax Act and allied laws. You may
                request deletion of data that we are not legally required to retain.
            </p>

            <h2>6. Your Rights</h2>
            <ul>
                <li>Access and correct your personal data.</li>
                <li>Request deletion, subject to legal retention requirements.</li>
                <li>Withdraw consent for non-essential processing.</li>
            </ul>

            <h2>7. Contact / Grievance Officer</h2>
            <p>
                For privacy requests, email <a href="mailto:privacy@taxkosh.com">privacy@taxkosh.com</a>. Our
                Grievance Officer can be reached via the <a href="/contact">Contact page</a>.
            </p>

            <p className="text-xs italic mt-8">
                This document is a template and should be reviewed by qualified legal counsel before production use.
            </p>
        </>
    );
}
