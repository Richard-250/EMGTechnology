import pg from 'pg';

const { Client } = pg;
const adminClient = new Client({
    host: process.env.PGHOST || 'localhost',
    port: +(process.env.PGPORT || 5432),
    database: 'postgres',
});

await adminClient.connect();

await adminClient.query(`
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'emg_admin') THEN
            CREATE ROLE emg_admin LOGIN PASSWORD 'emg_dev_password';
        ELSE
            ALTER ROLE emg_admin WITH LOGIN PASSWORD 'emg_dev_password';
        END IF;
    END
    $$;
`);

const database = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = 'emgtechnology'`,
);

if (database.rowCount === 0) {
    await adminClient.query('CREATE DATABASE emgtechnology OWNER emg_admin');
    console.log('Created PostgreSQL database: emgtechnology');
} else {
    console.log('PostgreSQL database already exists: emgtechnology');
}

await adminClient.end();

const appClient = new Client({
    host: process.env.PGHOST || 'localhost',
    port: +(process.env.PGPORT || 5432),
    database: 'emgtechnology',
});

await appClient.connect();
await appClient.query('GRANT ALL ON SCHEMA public TO emg_admin');
await appClient.query('GRANT CREATE ON SCHEMA public TO emg_admin');
await appClient.query('ALTER SCHEMA public OWNER TO emg_admin');
await appClient.end();

console.log('pgAdmin connection: localhost:5432 / emgtechnology / emg_admin');
