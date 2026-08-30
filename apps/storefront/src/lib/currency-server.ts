import {getCurrencyCookie, DEFAULT_CURRENCY} from './currency';
import {getActiveChannelCached} from './vendure/cached';

/**
 * Get the active currency code for the current request.
 * Reads from cookie, falls back to RWF when available on the channel.
 */
export async function getActiveCurrencyCode(): Promise<string> {
    const cookieValue = await getCurrencyCookie();
    if (cookieValue) return cookieValue;

    const channel = await getActiveChannelCached();
    const available = channel.availableCurrencyCodes as string[];
    if (available.includes(DEFAULT_CURRENCY)) {
        return DEFAULT_CURRENCY;
    }
    return channel.defaultCurrencyCode;
}
