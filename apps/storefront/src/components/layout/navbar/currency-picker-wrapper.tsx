import {getActiveChannel} from '@/lib/vendure/actions';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {CurrencyPicker} from './currency-picker';

// Intentionally dynamic (not cached) — reads the currency cookie via
// getActiveCurrencyCode() so the picker reflects the user's current selection.
export async function CurrencyPickerWrapper() {
    try {
        const channel = await getActiveChannel();
        const activeCurrency = await getActiveCurrencyCode();

        return (
            <CurrencyPicker
                availableCurrencyCodes={channel.availableCurrencyCodes}
                activeCurrencyCode={activeCurrency}
            />
        );
    } catch (error) {
        console.error('Error loading currency picker:', error);
        return (
            <CurrencyPicker
                availableCurrencyCodes={['RWF', 'USD']}
                activeCurrencyCode="RWF"
            />
        );
    }
}
