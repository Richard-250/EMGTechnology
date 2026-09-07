import {Logger, TransactionalConnection} from '@vendure/core';
import type {bootstrap} from '@vendure/core';

const loggerCtx = 'EnsureCustomFields';

/**
 * Production often runs with synchronize=false, so new customFields never get columns.
 * Missing Order.customFields columns break the admin order detail GraphQL query.
 */
const COLUMNS: Array<{table: string; column: string; sqlType: string}> = [
    {table: 'order', column: 'customFieldsPaymentconfirmedbyid', sqlType: 'character varying(255)'},
    {table: 'order', column: 'customFieldsPaymentconfirmedbyname', sqlType: 'character varying(255)'},
    {table: 'order', column: 'customFieldsPaymentconfirmedat', sqlType: 'timestamp without time zone'},
    {table: 'global_settings', column: 'customFieldsRwfperusd', sqlType: 'double precision'},
    {table: 'global_settings', column: 'customFieldsOrdernotifymode', sqlType: 'character varying(255)'},
    {
        table: 'global_settings',
        column: 'customFieldsOrdernotifyadministratorids',
        sqlType: 'text',
    },
    {
        table: 'payment_method',
        column: 'customFieldsMerchantdisplayname',
        sqlType: 'character varying(255)',
    },
    {table: 'payment_method', column: 'customFieldsMerchantphone', sqlType: 'character varying(255)'},
    {table: 'payment_method', column: 'customFieldsMerchantmomocode', sqlType: 'character varying(255)'},
    {table: 'payment_method', column: 'customFieldsPaymentsteps', sqlType: 'text'},
];

export async function ensureCustomFieldColumns(app: Awaited<ReturnType<typeof bootstrap>>) {
    const connection = app.get(TransactionalConnection);
    const dataSource = connection.rawConnection;

    for (const {table, column, sqlType} of COLUMNS) {
        const rows: Array<{exists: boolean}> = await dataSource.query(
            `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = $1
                  AND column_name = $2
            ) AS exists
            `,
            [table, column],
        );
        if (rows[0]?.exists) {
            continue;
        }
        // Identifiers are from our fixed allowlist above — never from user input.
        await dataSource.query(
            `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${sqlType}`,
        );
        Logger.info(`Added missing column ${table}.${column}`, loggerCtx);
    }
}
