import { vendureDashboardPlugin } from '@vendure/dashboard/vite';
import 'dotenv/config';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));
const dashboardCss = resolve(rootDir, 'src/plugins/emg-branding/dashboard/dashboard.css');
const dashboardOutDir = resolve(rootDir, 'dist/dashboard');

export default defineConfig({
    root: rootDir,
    base: '/dashboard',
    build: {
        outDir: dashboardOutDir,
        emptyOutDir: true,
    },
    plugins: [
        vendureDashboardPlugin({
            vendureConfigPath: pathToFileURL(resolve(rootDir, 'src/vendure-config.ts')),
            api: process.env.NODE_ENV === 'production'
                ? { host: 'auto', port: 'auto' }
                : { host: 'http://localhost', port: +(process.env.PORT || 3001) },
            gqlOutputPath: resolve(rootDir, 'src/gql'),
            theme: {
                additionalStylesheets: [dashboardCss],
                light: {
                    primary: 'oklch(0.58 0.16 142)',
                    'primary-foreground': 'oklch(0.99 0 0)',
                    brand: '#269A2D',
                    'brand-lighter': '#5CBF60',
                    'brand-darker': '#1B5E20',
                    background: '#F4F6F8',
                    foreground: '#161C24',
                    card: '#FFFFFF',
                    'card-foreground': '#161C24',
                    border: 'oklch(0.88 0.01 240)',
                    ring: 'oklch(0.58 0.16 142)',
                    'sidebar-primary': 'oklch(0.58 0.16 142)',
                    'sidebar-primary-foreground': 'oklch(0.99 0 0)',
                    radius: '0.75rem',
                },
                dark: {
                    primary: 'oklch(0.68 0.15 142)',
                    'primary-foreground': 'oklch(0.14 0.02 140)',
                    brand: '#269A2D',
                    'brand-lighter': '#5CBF60',
                    'brand-darker': '#1B5E20',
                    background: '#141A21',
                    foreground: '#FFFFFF',
                    card: '#212B36',
                    'card-foreground': '#FFFFFF',
                    'muted-foreground': '#919EAB',
                    border: 'oklch(0.32 0.02 240)',
                    'chart-1': '#269A2D',
                    'chart-2': '#5CBF60',
                    'chart-3': '#8FD992',
                    'chart-4': '#F59E0B',
                    'chart-5': '#00B8D9',
                    ring: 'oklch(0.68 0.15 142)',
                    'sidebar': '#161C24',
                    'sidebar-foreground': '#FFFFFF',
                    'sidebar-primary': '#269A2D',
                    'sidebar-primary-foreground': '#FFFFFF',
                    'sidebar-accent': '#212B36',
                    'sidebar-accent-foreground': '#FFFFFF',
                    'sidebar-border': 'oklch(0.28 0.02 240)',
                    radius: '1rem',
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '@/gql': resolve(rootDir, 'src/gql/graphql.ts'),
        },
    },
});
