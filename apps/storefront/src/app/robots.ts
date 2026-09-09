import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/metadata';

export default function robots(): MetadataRoute.Robots {
    const base = SITE_URL.replace(/\/$/, '');

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/*/cart',
                    '/*/checkout',
                    '/*/account',
                    '/*/sign-in',
                    '/*/login',
                    '/*/register',
                    '/*/forgot-password',
                    '/*/reset-password',
                    '/*/verify',
                    '/*/verify-pending',
                    '/*/order-confirmation',
                    '/*/search',
                    '/api/',
                ],
            },
        ],
        sitemap: `${base}/sitemap.xml`,
        host: base,
    };
}
