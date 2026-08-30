const API = 'http://localhost:3001';

async function check(url, label) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const ok = res.ok;
        let extra = '';
        if (url.endsWith('/__status')) {
            const json = await res.json();
            extra = ` (mode: ${json.mode})`;
        }
        console.log(ok ? `✓ ${label}${extra}` : `✗ ${label} — HTTP ${res.status}`);
        return ok;
    } catch (err) {
        console.log(`✗ ${label} — ${err.cause?.code === 'ECONNREFUSED' ? 'server not running' : err.message}`);
        return false;
    }
}

console.log('\nEMG Admin status check\n');

const health = await check(`${API}/health`, 'API server (port 3001)');
const dashboard = health ? await check(`${API}/dashboard/__status`, 'Dashboard') : false;

console.log('');
if (health && dashboard) {
    console.log('Ready! Open: http://localhost:3001/dashboard');
    console.log('Login:  superadmin / change-me\n');
} else if (!health) {
    console.log('Start the API server first:');
    console.log('  cd apps/server');
    console.log('  npm run dev:server\n');
    console.log('Wait until you see "running on port 3001", then open the URL above.\n');
} else {
    console.log('Server is up but dashboard files may be missing. Run:');
    console.log('  npm run admin\n');
}
