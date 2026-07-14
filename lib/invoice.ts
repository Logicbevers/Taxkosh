import PDFDocument from 'pdfkit';

interface InvoiceData {
    invoiceNumber: string;
    date: Date;
    userName: string;
    userEmail: string;
    userPan?: string;
    serviceCategory: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export function generatePdfInvoice(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        // --- header ---
        // Company identity comes from env so real registration details are
        // used in production. The GSTIN line is omitted entirely when not
        // configured — a fabricated GSTIN on a tax invoice is a compliance
        // violation, never a placeholder.
        const companyName = process.env.COMPANY_LEGAL_NAME ?? 'TaxKosh LLP';
        const addressLine1 = process.env.COMPANY_ADDRESS_LINE1 ?? '';
        const addressLine2 = process.env.COMPANY_ADDRESS_LINE2 ?? 'New Delhi, India';
        const gstin = process.env.COMPANY_GSTIN ?? process.env.NEXT_PUBLIC_COMPANY_GSTIN;

        doc.fontSize(20).text('TaxKosh', 50, 50);
        doc.fontSize(10).fillColor('#666666').text(companyName, 50, 75);
        let headerY = 90;
        if (addressLine1) { doc.text(addressLine1, 50, headerY); headerY += 15; }
        doc.text(addressLine2, 50, headerY); headerY += 15;
        if (gstin) { doc.text(`GSTIN: ${gstin}`, 50, headerY); }

        doc.fontSize(16).fillColor('#000000')
            .text('TAX INVOICE', 400, 50, { align: 'right' });

        doc.fontSize(10).text(`Invoice Number: ${data.invoiceNumber}`, 400, 75, { align: 'right' })
            .text(`Date: ${data.date.toLocaleDateString()}`, 400, 90, { align: 'right' });

        doc.moveDown(3);
        const yPosInfo = doc.y;

        // --- Billed To ---
        doc.fontSize(12).font('Helvetica-Bold').text('Billed To:', 50, yPosInfo);
        doc.fontSize(10).font('Helvetica')
            .text(data.userName, 50, yPosInfo + 15)
            .text(data.userEmail, 50, yPosInfo + 30);

        if (data.userPan) {
            const maskedPan = `${data.userPan.slice(0, 5)}****${data.userPan.slice(9)}`;
            doc.text(`PAN: ${maskedPan}`, 50, yPosInfo + 45);
        }

        doc.moveDown(4);

        // --- Table Header ---
        const startY = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, startY);
        doc.text('Amount (INR)', 450, startY, { align: 'right' });
        doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

        // --- Table Row ---
        doc.font('Helvetica');
        const rowY = startY + 25;
        doc.text(`Professional Services: ${data.serviceCategory.replace(/_/g, " ")}`, 50, rowY);
        doc.text(`Rs. ${(data.subtotal / 100).toFixed(2)}`, 450, rowY, { align: 'right' });
        doc.moveTo(50, rowY + 15).lineTo(550, rowY + 15).stroke();

        // --- Totals ---
        const totalsY = rowY + 30;
        doc.text('Subtotal:', 350, totalsY);
        doc.text(`Rs. ${(data.subtotal / 100).toFixed(2)}`, 450, totalsY, { align: 'right' });

        doc.text('CGST (9%):', 350, totalsY + 15);
        doc.text(`Rs. ${(data.cgst / 100).toFixed(2)}`, 450, totalsY + 15, { align: 'right' });

        doc.text('SGST (9%):', 350, totalsY + 30);
        doc.text(`Rs. ${(data.sgst / 100).toFixed(2)}`, 450, totalsY + 30, { align: 'right' });

        // IGST placeholder handling if applied (currently defaulting to intra-state)

        doc.moveTo(350, totalsY + 50).lineTo(550, totalsY + 50).stroke();

        doc.font('Helvetica-Bold');
        doc.text('Total:', 350, totalsY + 60);
        doc.text(`Rs. ${(data.total / 100).toFixed(2)}`, 450, totalsY + 60, { align: 'right' });

        // --- Footer ---
        doc.font('Helvetica').fontSize(10);
        doc.text('Authorized Signatory', 450, totalsY + 120, { align: 'right' });
        doc.fillColor('#999999').text('This is a computer generated invoice.', 50, 750, { align: 'center' });

        doc.end();
    });
}
