import {cacheLife, cacheTag} from 'next/cache';
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

async function fetchRwfPerUsd(): Promise<number> {
    try {
        const response = await fetch(VENDURE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [VENDURE_CHANNEL_TOKEN_HEADER]: VENDURE_CHANNEL_TOKEN,
            },
            body: JSON.stringify({query: '{ emgStorefrontRwfPerUsd }'}),
            next: {tags: ['exchange-rate']},
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

async function getRwfPerUsdCached(): Promise<number> {
    'use cache';
    cacheLife('hours');
    cacheTag('exchange-rate');
    return fetchRwfPerUsd();
}

/** Live admin RWF-per-USD rate for converting search-card prices. */
export async function getRwfPerUsd(): Promise<number> {
    try {
        return await getRwfPerUsdCached();
    } catch {
        return fetchRwfPerUsd();
    }
}
