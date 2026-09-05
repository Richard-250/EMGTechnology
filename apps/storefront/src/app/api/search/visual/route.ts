import {NextRequest, NextResponse} from 'next/server';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard} from '@/lib/product-price';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {buildImageSignature, signatureSimilarity} from '@/lib/visual-similarity';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const CATALOG_TAKE = 80;
const RESULT_TAKE = 24;
const MIN_SCORE = 0.35;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch(url, {signal: controller.signal, next: {revalidate: 3600}});
        clearTimeout(timer);
        if (!res.ok) return null;
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const form = await request.formData();
        const file = form.get('image');
        const locale = String(form.get('locale') || 'en');

        if (!(file instanceof File)) {
            return NextResponse.json({error: 'Missing image file', items: []}, {status: 400});
        }
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({error: 'File must be an image', items: []}, {status: 400});
        }
        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                {error: 'Image is too large (max 25MB)', items: []},
                {status: 413},
            );
        }

        const queryBuffer = Buffer.from(await file.arrayBuffer());
        const querySig = await buildImageSignature(queryBuffer);

        const currencyCode = await getActiveCurrencyCode();
        const catalog = await query(
            SearchProductsQuery,
            {
                input: {
                    take: CATALOG_TAKE,
                    skip: 0,
                    groupByProduct: true,
                },
            },
            {languageCode: locale, currencyCode},
        );

        const cards = catalog.data.search.items.map(item => serializeProductCard(item));
        const scored: Array<{card: (typeof cards)[number]; score: number}> = [];

        // Score in small parallel batches to avoid hammering the image CDN
        const batchSize = 8;
        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async card => {
                    if (!card.image) return null;
                    const buf = await fetchImageBuffer(card.image);
                    if (!buf) return null;
                    try {
                        const sig = await buildImageSignature(buf);
                        const score = signatureSimilarity(querySig, sig);
                        return {card, score};
                    } catch {
                        return null;
                    }
                }),
            );
            for (const row of results) {
                if (row) scored.push(row);
            }
        }

        scored.sort((a, b) => b.score - a.score);
        const matched = scored.filter(row => row.score >= MIN_SCORE).slice(0, RESULT_TAKE);
        const items = matched.map(row => row.card);

        return NextResponse.json({
            items,
            total: items.length,
            analyzed: scored.length,
            topScore: scored[0]?.score ?? 0,
        });
    } catch (error) {
        console.error('Visual search failed:', error);
        return NextResponse.json(
            {error: 'Visual search failed. Please try again.', items: []},
            {status: 500},
        );
    }
}
