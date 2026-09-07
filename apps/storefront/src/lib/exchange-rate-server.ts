import {DEFAULT_RWF_PER_USD} from '@/lib/currency-convert';

const rawApiUrl =
    process.env.VENDURE_SHOP_API_URL ||
    process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ||
    'http://127.0.0.1:3001/shop-api';
const VENDURE_API_URL = rawApiUrl.startsWith('http')
    ? rawApiUrl
    : `http://127.0.0.1:3001${rawApiUrl.startsWith('/') ? '' : '/'}${rawApiUrl}`;
const VENDURE_CHANNEL_TOKEN =
    process.env.VENDURE_CHANNEL_TOKEN ||
    process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN ||
    '__default_channel__';
const VENDURE_CHANNEL_TOKEN_HEADER = process.env.VENDURE_CHANNEL_TOKEN_HEADER || 'vendure-token';

/**
 * Live admin RWF-per-USD rate for converting search-card prices.
 * No "use cache" here — this module may be imported from API routes and must
 * stay free of Client Component / cacheLife restrictions.
 */
export async function getRwfPerUsd(): Promise<number> {
    try {
        const response = await fetch(VENDURE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [VENDURE_CHANNEL_TOKEN_HEADER]: VENDURE_CHANNEL_TOKEN,
            },
            body: JSON.stringify({query: '{ emgStorefrontRwfPerUsd }'}),
            next: {revalidate: 3600, tags: ['exchange-rate']},
        });
        if (!response.ok) return DEFAULT_RWF_PER_USD;
        const json = (await response.json()) as {
            data?: {emgStorefrontRwfPerUsd?: number};
        };
        const rate = Number(json.data?.emgStorefrontRwfPerUsd);
        return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RWF_PER_USD;
    } catch {
        return DEFAULT_RWF_PER_USD;
    }
}
