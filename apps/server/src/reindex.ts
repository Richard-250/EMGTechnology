import { bootstrap, RequestContextService, SearchService } from '@vendure/core';
import { config } from './vendure-config';

async function run() {
    console.log('Bootstrapping Vendure...');
    const app = await bootstrap(config);
    const searchService = app.get(SearchService);
    const requestContextService = app.get(RequestContextService);
    const ctx = await requestContextService.create({ apiType: 'admin' });

    console.log('Triggering full search reindex...');
    const job = await searchService.reindex(ctx);
    console.log(`Reindex job queued (ID: ${job.id}, state: ${job.state})`);

    await app.close();
    console.log('Done!');
    process.exit(0);
}

run().catch(err => {
    console.error('Reindex script failed:', err);
    process.exit(1);
});
