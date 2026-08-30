import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

for (const url of [
    'http://localhost:3001/dashboard',
    'http://localhost:3001/dashboard/',
    'http://localhost:3001/dashboard/login',
]) {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(20000);
    const app = await page.locator('#app').innerHTML();
    const inputs = await page.locator('input').count();
    console.log(url, 'inputs:', inputs, 'appLen:', app.length, 'title:', await page.title());
}

// Check admin API from page
const api = await page.evaluate(async () => {
    try {
        const r = await fetch('/admin-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '{ activeChannel { id code } }' }),
        });
        const j = await r.json();
        return { ok: r.ok, data: j };
    } catch (e) {
        return { error: String(e) };
    }
});
console.log('admin-api:', JSON.stringify(api).slice(0, 300));
console.log('errors:', errors);
await browser.close();
