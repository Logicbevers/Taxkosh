import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_TestKey123");

export async function sendInvoiceEmail(toEmail: string, userName: string, invoiceNumber: string, invoicePdfBuffer: Buffer) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[Simulated Email] Sending Invoice ${invoiceNumber} to ${toEmail}`);
        return { success: true, simulated: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: "TaxKosh Billing <billing@taxkosh.com>", // You'd need a verified domain in Resend
            to: [toEmail],
            subject: `TaxKosh Invoice - ${invoiceNumber}`,
            html: `
                <div>
                     <h1>Thank you for your payment, ${userName}!</h1>
                     <p>We have successfully received your payment for the service request.</p>
                     <p>Please find your official GST-compliant tax invoice attached.</p>
                     <p><br/>Best,<br/>The TaxKosh Team</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${invoiceNumber}.pdf`,
                    content: invoicePdfBuffer,
                }
            ]
        });

        if (error) {
            console.error("Resend Email Error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Resend Exception:", error);
        return { success: false, error };
    }
}
