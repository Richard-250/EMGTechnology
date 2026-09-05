/**
 * Build a WhatsApp deep-link so admins receive product context from the customer.
 */
import {COMPANY} from '@/lib/company';

export function buildProductWhatsAppUrl(input: {
    productName: string;
    productSlug: string;
    sku?: string;
    priceLabel?: string;
    currencyCode?: string;
    quantity?: number;
}): string {
    const origin =
        typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://emgtechnologyltd.com';

    const productUrl = `${origin}/product/${input.productSlug}`;
    const lines = [
        `Hello ${COMPANY.shortName}, I am interested in this product:`,
        '',
        `Product: ${input.productName}`,
        input.sku ? `SKU: ${input.sku}` : null,
        input.priceLabel ? `Price: ${input.priceLabel}${input.currencyCode ? ` ${input.currencyCode}` : ''}` : null,
        input.quantity && input.quantity > 1 ? `Quantity: ${input.quantity}` : null,
        `Link: ${productUrl}`,
        '',
        'Please confirm availability and how I can order.',
    ].filter(Boolean);

    return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
