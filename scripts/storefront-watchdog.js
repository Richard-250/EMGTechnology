#!/usr/bin/env node
/**
 * Restarts emg-storefront when nginx would otherwise 502:
 * Next hung/dead while PM2 still showed the parent process as "online".
 */
const http = require('http');
const {execFile} = require('child_process');

const HOST = process.env.WATCHDOG_HOST || '127.0.0.1';
const PORT = Number(process.env.WATCHDOG_PORT || 3002);
const PATH = process.env.WATCHDOG_PATH || '/api/health';
const INTERVAL_MS = Number(process.env.WATCHDOG_INTERVAL_MS || 20_000);
const TIMEOUT_MS = Number(process.env.WATCHDOG_TIMEOUT_MS || 5_000);
const FAIL_THRESHOLD = Number(process.env.WATCHDOG_FAIL_THRESHOLD || 3);
const COOLDOWN_MS = Number(process.env.WATCHDOG_COOLDOWN_MS || 90_000);
const STARTUP_GRACE_MS = Number(process.env.WATCHDOG_STARTUP_GRACE_MS || 15_000);

let fails = 0;
let lastRestartAt = 0;
let checking = false;

function log(message) {
    console.log(`[storefront-watchdog] ${new Date().toISOString()} ${message}`);
}

function probe() {
    return new Promise((resolve, reject) => {
        const req = http.get(
            {hostname: HOST, port: PORT, path: PATH, timeout: TIMEOUT_MS},
            res => {
                res.resume();
                if (res.statusCode && res.statusCode < 500) {
                    resolve(res.statusCode);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            },
        );
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('timeout'));
        });
        req.on('error', reject);
    });
}

function restartStorefront() {
    return new Promise((resolve, reject) => {
        execFile('pm2', ['restart', 'emg-storefront', '--update-env'], {timeout: 60_000}, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(stderr || err.message));
                return;
            }
            resolve(stdout.trim());
        });
    });
}

async function tick() {
    if (checking) return;
    checking = true;
    try {
        const status = await probe();
        if (fails > 0) {
            log(`recovered (HTTP ${status}) after ${fails} failure(s)`);
        }
        fails = 0;
    } catch (err) {
        fails += 1;
        log(`health check failed (${fails}/${FAIL_THRESHOLD}): ${err.message}`);
        const sinceRestart = Date.now() - lastRestartAt;
        if (fails >= FAIL_THRESHOLD && sinceRestart >= COOLDOWN_MS) {
            log('restarting emg-storefront');
            lastRestartAt = Date.now();
            fails = 0;
            try {
                const out = await restartStorefront();
                if (out) log(out);
            } catch (restartErr) {
                log(`pm2 restart failed: ${restartErr.message}`);
            }
        }
    } finally {
        checking = false;
    }
}

log(`watching http://${HOST}:${PORT}${PATH} every ${INTERVAL_MS}ms`);
setTimeout(() => {
    tick();
    setInterval(tick, INTERVAL_MS);
}, STARTUP_GRACE_MS);
