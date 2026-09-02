import {PluginCommonModule, VendurePlugin} from '@vendure/core';

/** Marks that customer email changes are disabled for this store (UI removed; email handler filtered). */
@VendurePlugin({
    imports: [PluginCommonModule],
})
export class EmailChangeBlockPlugin {}
