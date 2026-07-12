import { LegalHeader } from "@/components/legal-header";

export const metadata = { title: "Refund & Cancellation Policy — TaxKosh" };

export default function RefundPage() {
    return (
        <>
            <LegalHeader title="Refund & Cancellation Policy" updated="1 July 2026" />

            <p>
                We want you to be confident when purchasing a TaxKosh service. This policy explains when refunds
                and cancellations apply.
            </p>

            <h2>1. Before Work Begins</h2>
            <p>
                If you cancel a service request <strong>before</strong> our team has started work (typically before
                documents are submitted for review), you are eligible for a <strong>full refund</strong> of the
                service fee.
            </p>

            <h2>2. After Work Begins</h2>
            <p>
                Once our experts have started reviewing your documents or preparing your filing, the fee becomes
                partially non-refundable to cover work performed. Any refund in this stage is assessed on a
                pro-rata basis at our discretion.
            </p>

            <h2>3. After Filing</h2>
            <p>
                Once a return has been filed with the relevant tax authority, the service is considered delivered
                and is <strong>non-refundable</strong>.
            </p>

            <h2>4. Service Failure</h2>
            <p>
                If we are unable to deliver the service you paid for due to a fault on our side, you are entitled to
                a full refund.
            </p>

            <h2>5. How to Request a Refund</h2>
            <p>
                Email <a href="mailto:support@taxkosh.com">support@taxkosh.com</a> with your invoice number and
                reason. We aim to respond within 3 business days. Approved refunds are processed to your original
                payment method within 5–7 business days via Razorpay.
            </p>

            <h2>6. Payment Failures</h2>
            <p>
                If money is debited but your order is not confirmed, it is typically auto-reversed by your bank
                within 5–7 business days. If it is not, contact us with your transaction reference and we will
                assist.
            </p>

            <p className="text-xs italic mt-8">
                This document is a template and should be reviewed by qualified legal counsel before production use.
            </p>
        </>
    );
}
