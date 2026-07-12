import { LegalHeader } from "@/components/legal-header";

export const metadata = { title: "Terms of Service — TaxKosh" };

export default function TermsPage() {
    return (
        <>
            <LegalHeader title="Terms of Service" updated="1 July 2026" />

            <p>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the TaxKosh platform,
                operated by TaxKosh Technologies Pvt. Ltd. (&quot;TaxKosh&quot;, &quot;we&quot;, &quot;us&quot;). By creating an
                account or using our services, you agree to be bound by these Terms.
            </p>

            <h2>1. Services</h2>
            <p>
                TaxKosh provides technology-assisted tax and compliance services including Income Tax return
                preparation, GST filing, TDS filing, and related advisory. Filings are prepared based on
                information and documents you provide. You remain responsible for the accuracy and completeness
                of the information you submit.
            </p>

            <h2>2. Eligibility &amp; Account</h2>
            <p>
                You must be at least 18 years old and capable of entering into a binding contract. You are
                responsible for maintaining the confidentiality of your account credentials and for all activity
                under your account.
            </p>

            <h2>3. Fees &amp; Payment</h2>
            <p>
                Service fees are displayed before purchase and are payable in advance via our payment partner,
                Razorpay. All fees are inclusive of applicable GST unless stated otherwise. A GST-compliant tax
                invoice is issued for every successful payment and is available under Billing &amp; Invoices.
            </p>

            <h2>4. Your Responsibilities</h2>
            <ul>
                <li>Provide accurate, complete, and timely information and documents.</li>
                <li>Review all prepared filings before authorising submission.</li>
                <li>Retain copies of your records as required by law.</li>
            </ul>

            <h2>5. Limitation of Liability</h2>
            <p>
                TaxKosh is a facilitation platform and does not guarantee any particular tax outcome, refund
                amount, or acceptance by tax authorities. To the maximum extent permitted by law, our aggregate
                liability for any claim is limited to the fees paid by you for the specific service giving rise to
                the claim.
            </p>

            <h2>6. Termination</h2>
            <p>
                We may suspend or terminate access for breach of these Terms. You may close your account at any
                time by contacting support.
            </p>

            <h2>7. Governing Law</h2>
            <p>
                These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction
                of the courts of New Delhi.
            </p>

            <h2>8. Contact</h2>
            <p>
                Questions about these Terms? Email <a href="mailto:legal@taxkosh.com">legal@taxkosh.com</a> or visit
                our <a href="/contact">Contact page</a>.
            </p>

            <p className="text-xs italic mt-8">
                This document is a template and should be reviewed by qualified legal counsel before production use.
            </p>
        </>
    );
}
