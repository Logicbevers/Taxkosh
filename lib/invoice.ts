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
        doc.fontSize(20).text('TaxKosh', 50, 50);
        doc.fontSize(10).fillColor('#666666')
            .text('TaxKosh Finance Pvt. Ltd.', 50, 75)
            .text('123 Fintech Avenue, Tech Park', 50, 90)
            .text('New Delhi, 110001, India', 50, 105)
            .text('GSTIN: 07AABCU9603R1ZX', 50, 120);

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
            doc.text(`PAN: ${data.userPan}`, 50, yPosInfo + 45);
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
