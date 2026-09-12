import { Logger, RequestContextService, SearchService, TransactionalConnection } from '@vendure/core';
import type { bootstrap } from '@vendure/core';

const loggerCtx = 'EnsureSearchIndex';

/**
 * Checks if Vendure's search index is empty while products exist in the database.
 * If so, triggers an automatic reindex so the storefront displays products immediately.
 */
export async function ensureSearchIndex(app: Awaited<ReturnType<typeof bootstrap>>) {
    try {
        const connection = app.get(TransactionalConnection);
        const dataSource = connection.rawConnection;

        // Check if search_index_item table exists
        const tableCheck: Array<{ exists: boolean }> = await dataSource.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'search_index_item'
            ) AS exists
        `);

        if (!tableCheck[0]?.exists) {
            return;
        }

        const productCountRows: Array<{ count: string }> = await dataSource.query(`
            SELECT count(*)::text as count FROM "product" WHERE "deletedAt" IS NULL
        `);
        const productCount = parseInt(productCountRows[0]?.count || '0', 10);

        if (productCount === 0) {
            return;
        }

        const indexCountRows: Array<{ count: string }> = await dataSource.query(`
            SELECT count(*)::text as count FROM "search_index_item"
        `);
        const indexCount = parseInt(indexCountRows[0]?.count || '0', 10);

        if (indexCount === 0) {
            Logger.warn(
                `Search index is empty (${productCount} products in DB, 0 in search index). Triggering automatic reindex...`,
                loggerCtx,
            );
            const requestContextService = app.get(RequestContextService);
            const searchService = app.get(SearchService);
            const ctx = await requestContextService.create({ apiType: 'admin' });
            await searchService.reindex(ctx);
            Logger.info(`Automatic search reindex successfully queued for ${productCount} products.`, loggerCtx);
        } else {
            Logger.info(`Search index healthy: ${indexCount} items indexed for ${productCount} products.`, loggerCtx);
        }
    } catch (err) {
        Logger.error(`Error checking search index: ${err instanceof Error ? err.message : String(err)}`, loggerCtx);
    }
}
