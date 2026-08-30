import pg from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
const port = +(process.env.DB_PORT || process.env.PGPORT || 5432);
const adminUser = process.env.PGUSER || 'postgres';
const adminPassword = process.env.PGPASSWORD ?? process.env.DB_ADMIN_PASSWORD;

if (typeof adminPassword !== 'string' || adminPassword.length === 0) {
    console.error(
        'Missing PostgreSQL superuser password.\n' +
            'Set PGPASSWORD in apps/server/.env to your local postgres user password, then re-run npm run db:setup.',
    );
    process.exit(1);
}

const appUser = process.env.DB_USERNAME || 'emg_admin';
const appPassword = process.env.DB_PASSWORD || 'emg_dev_password';
const appDatabase = process.env.DB_NAME || 'emgtechnology';

const adminClient = new Client({
    host,
    port,
    user: adminUser,
    password: adminPassword,
    database: 'postgres',
});

await adminClient.connect();

await adminClient.query(
    `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${appUser}') THEN
            CREATE ROLE ${appUser} LOGIN PASSWORD '${appPassword}';
        ELSE
            ALTER ROLE ${appUser} WITH LOGIN PASSWORD '${appPassword}';
        END IF;
    END
    $$;
`,
);

const database = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
    appDatabase,
]);

if (database.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE ${appDatabase} OWNER ${appUser}`);
    console.log(`Created PostgreSQL database: ${appDatabase}`);
} else {
    console.log(`PostgreSQL database already exists: ${appDatabase}`);
}

await adminClient.end();

const appClient = new Client({
    host,
    port,
    user: adminUser,
    password: adminPassword,
    database: appDatabase,
});

await appClient.connect();
await appClient.query(`GRANT ALL ON SCHEMA public TO ${appUser}`);
await appClient.query(`GRANT CREATE ON SCHEMA public TO ${appUser}`);
await appClient.query(`ALTER SCHEMA public OWNER TO ${appUser}`);
await appClient.end();

console.log(`pgAdmin connection: ${host}:${port} / ${appDatabase} / ${appUser}`);
