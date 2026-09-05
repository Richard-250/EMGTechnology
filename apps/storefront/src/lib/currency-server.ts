import {getCurrencyCookie, DEFAULT_CURRENCY} from './currency';
import {getActiveChannelCached} from './vendure/cached';

/**
 * Get the active currency code for the current request.
 * Reads from cookie when it is available on the channel; otherwise falls back to RWF / channel default.
 */
export async function getActiveCurrencyCode(): Promise<string> {
    const channel = await getActiveChannelCached();
    const available = channel.availableCurrencyCodes as string[];

    const cookieValue = await getCurrencyCookie();
    if (cookieValue && available.includes(cookieValue)) {
        return cookieValue;
    }

    if (available.includes(DEFAULT_CURRENCY)) {
        return DEFAULT_CURRENCY;
    }
    return channel.defaultCurrencyCode;
}
