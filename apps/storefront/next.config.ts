import path from 'path';
import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
    // Monorepo: Next.js is hoisted to the workspace root node_modules.
    turbopack: {
        root: path.join(__dirname, '../..'),
    },
    cacheComponents: true,
    images: {
        // This is necessary to display images from your local Vendure instance
        dangerouslyAllowLocalIP: true,
        remotePatterns: [
            {
                hostname: 'readonlydemo.vendure.io',
            },
            {
                hostname: 'demo.vendure.io'
            },
            {
                hostname: 'localhost'
            }
        ],
    },
    experimental: {
        rootParams: true
    }
};

export default withNextIntl(nextConfig);
