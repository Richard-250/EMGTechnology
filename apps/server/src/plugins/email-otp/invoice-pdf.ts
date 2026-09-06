import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { Order } from '@vendure/core';

const BRAND_GREEN = '#269A2D';
const BRAND_INK = '#0C1210';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

function formatMoney(minor: number, currencyCode: string): string {
    const major = (minor ?? 0) / 100;
    try {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: currencyCode || 'RWF',
            maximumFractionDigits: currencyCode === 'RWF' ? 0 : 2,
        }).format(major);
    } catch {
        return `${major.toLocaleString()} ${currencyCode}`;
    }
}

function resolveLogoPath(): string | null {
    const candidates = [
        path.join(__dirname, '../../../static/email/assets/logo.png'),
        path.join(__dirname, '../../static/email/assets/logo.png'),
        path.join(process.cwd(), 'static/email/assets/logo.png'),
        path.join(process.cwd(), 'apps/server/static/email/assets/logo.png'),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

/**
 * Build a professional PDF invoice for a settled order (EMG brand colors + logo).
 */
export async function buildOrderInvoicePdf(order: Order): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 48 });
        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk as Buffer));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - 96;
        const logoPath = resolveLogoPath();

        if (logoPath) {
            try {
                doc.image(logoPath, 48, 40, { height: 36 });
            } catch {
                doc.fillColor(BRAND_GREEN).fontSize(22).font('Helvetica-Bold').text('emg', 48, 48);
            }
        } else {
            doc.fillColor(BRAND_GREEN).fontSize(22).font('Helvetica-Bold').text('emg', 48, 48);
        }

        doc.fillColor(BRAND_INK)
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Invoice', 48, 48, { align: 'right', width: contentWidth });

        doc.fillColor(MUTED)
            .fontSize(10)
            .font('Helvetica')
            .text(`#${order.code}`, 48, 72, { align: 'right', width: contentWidth });

        doc.moveDown(2);
        let y = 110;

        const issued = order.orderPlacedAt
            ? new Date(order.orderPlacedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
              })
            : new Date().toLocaleDateString('en-GB');

        doc.fillColor(BRAND_INK).fontSize(11).font('Helvetica-Bold').text('Invoice Details', 48, y);
        y += 18;
        doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('Date of Issue', 48, y);
        doc.fillColor(BRAND_INK).text(issued, 180, y);
        y += 28;

        // From / To boxes
        const boxTop = y;
        doc.roundedRect(48, boxTop, contentWidth / 2 - 8, 90, 8).stroke(BORDER);
        doc.roundedRect(48 + contentWidth / 2 + 8, boxTop, contentWidth / 2 - 8, 90, 8).stroke(BORDER);

        doc.fillColor(MUTED).fontSize(9).text('Billed From', 60, boxTop + 10);
        doc.fillColor(BRAND_INK)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('EMG Technology Ltd', 60, boxTop + 26);
        doc.font('Helvetica')
            .fillColor(MUTED)
            .fontSize(9)
            .text('Kigali City Tower, Ground Floor\nKN 2 St, Nyarugenge, Kigali\nRwanda · +250 796 345 773', 60, boxTop + 42, {
                width: contentWidth / 2 - 28,
            });

        const ship = order.shippingAddress;
        const customerName =
            ship?.fullName ||
            [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') ||
            'Customer';
        doc.fillColor(MUTED)
            .fontSize(9)
            .text('Billed To', 48 + contentWidth / 2 + 20, boxTop + 10);
        doc.fillColor(BRAND_INK)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(customerName, 48 + contentWidth / 2 + 20, boxTop + 26, {
                width: contentWidth / 2 - 28,
            });
        doc.font('Helvetica')
            .fillColor(MUTED)
            .fontSize(9)
            .text(
                [
                    order.customer?.emailAddress,
                    ship?.streetLine1,
                    [ship?.city, ship?.province].filter(Boolean).join(', '),
                    ship?.country,
                    ship?.phoneNumber,
                ]
                    .filter(Boolean)
                    .join('\n'),
                48 + contentWidth / 2 + 20,
                boxTop + 42,
                { width: contentWidth / 2 - 28 },
            );

        y = boxTop + 110;

        // Summary strip
        doc.roundedRect(48, y, contentWidth, 52, 8).fillAndStroke('#f3faf4', '#cde9d0');
        doc.fillColor(MUTED).fontSize(9).text('Total Due', 64, y + 12);
        doc.fillColor(BRAND_GREEN)
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(formatMoney(order.totalWithTax, order.currencyCode), 64, y + 26);
        y += 70;

        // Line items
        doc.fillColor(BRAND_INK).fontSize(12).font('Helvetica-Bold').text('Order Items', 48, y);
        y += 18;

        doc.fillColor(MUTED).fontSize(8).font('Helvetica');
        doc.text('PRODUCT', 48, y);
        doc.text('QTY', 300, y);
        doc.text('UNIT', 350, y, { width: 80, align: 'right' });
        doc.text('TOTAL', 430, y, { width: 90, align: 'right' });
        y += 12;
        doc.moveTo(48, y).lineTo(48 + contentWidth, y).stroke(BORDER);
        y += 10;

        for (const line of order.lines ?? []) {
            const name = line.productVariant?.name || 'Item';
            const qty = line.quantity ?? 1;
            const unit = line.unitPriceWithTax ?? 0;
            const total = line.linePriceWithTax ?? unit * qty;

            doc.fillColor(BRAND_INK).fontSize(10).font('Helvetica').text(name, 48, y, { width: 240 });
            const rowHeight = Math.max(16, doc.heightOfString(name, { width: 240 }));
            doc.text(String(qty), 300, y);
            doc.text(formatMoney(unit, order.currencyCode), 350, y, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').text(formatMoney(total, order.currencyCode), 430, y, {
                width: 90,
                align: 'right',
            });
            y += rowHeight + 10;

            if (y > doc.page.height - 120) {
                doc.addPage();
                y = 48;
            }
        }

        doc.moveTo(48, y).lineTo(48 + contentWidth, y).stroke(BORDER);
        y += 14;

        const rows: Array<[string, number]> = [
            ['Subtotal', order.subTotalWithTax],
            ['Shipping', order.shippingWithTax],
            ['Total', order.totalWithTax],
        ];
        for (const [label, amount] of rows) {
            const isTotal = label === 'Total';
            doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(isTotal ? 12 : 10)
                .fillColor(isTotal ? BRAND_GREEN : BRAND_INK)
                .text(label, 300, y, { width: 120, align: 'right' });
            doc.text(formatMoney(amount, order.currencyCode), 430, y, { width: 90, align: 'right' });
            y += isTotal ? 20 : 16;
        }

        y += 24;
        doc.fillColor(MUTED)
            .fontSize(9)
            .font('Helvetica')
            .text(
                'Payment confirmed by EMG Technology Ltd. Thank you for your purchase.',
                48,
                y,
                { width: contentWidth },
            );
        y += 28;
        doc.fillColor(BRAND_GREEN)
            .fontSize(9)
            .text('EMG Technology Ltd © 2026 · emgtechnologyltd.com', 48, y, {
                width: contentWidth,
                align: 'center',
            });

        doc.end();
    });
}
