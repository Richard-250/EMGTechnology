import fs from 'fs';
import path from 'path';

function isBuiltDashboard(dir: string): boolean {
    try {
        const indexPath = path.join(dir, 'index.html');
        if (!fs.existsSync(indexPath)) {
            return false;
        }
        const html = fs.readFileSync(indexPath, 'utf8');
        return html.includes('id="app"') && /assets\/index-[^"]+\.js/.test(html);
    } catch {
        return false;
    }
}

/**
 * Resolve the compiled Vendure dashboard directory.
 * When running from dist/index.js, __dirname is apps/server/dist.
 */
export function resolveDashboardAppDir(distDir: string): string {
    const candidates = [
        path.join(distDir, 'dashboard'),
        path.join(distDir, '..', 'dist', 'dashboard'),
        path.join(process.cwd(), 'dist', 'dashboard'),
        path.join(process.cwd(), 'apps', 'server', 'dist', 'dashboard'),
    ];

    for (const candidate of candidates) {
        if (isBuiltDashboard(candidate)) {
            return candidate;
        }
    }

    return path.join(distDir, 'dashboard');
}

export function assertBuiltDashboardInProduction(appDir: string): void {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    if (isBuiltDashboard(appDir)) {
        return;
    }
    console.error(
        [
            '',
            'ERROR: Vendure admin dashboard is not built.',
            'The /dashboard route will show the placeholder until you run:',
            '  cd /var/www/EMGTechnology && rm -rf apps/server/dist/dashboard && npm run build -w server',
            '  pm2 restart emg-server emg-worker --update-env',
            '',
        ].join('\n'),
    );
}
