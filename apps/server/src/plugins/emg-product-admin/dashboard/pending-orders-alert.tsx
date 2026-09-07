import {api, graphql} from '@vendure/dashboard';

const pendingPaymentOrdersQuery = graphql(`
    query EmgPendingPaymentOrdersAlert {
        orders(
            options: {
                take: 1
                filter: {state: {eq: "PaymentAuthorized"}}
            }
        ) {
            totalItems
        }
    }
`);

/**
 * Bell-icon alert when customers have submitted proof and await staff confirmation.
 */
export const pendingPaymentOrdersAlert = {
    id: 'emg-pending-payment-orders',
    check: async () => {
        try {
            const data = await api.query(pendingPaymentOrdersQuery, {});
            return data.orders?.totalItems ?? 0;
        } catch {
            return 0;
        }
    },
    shouldShow: (count: number) => count > 0,
    title: (count: number) =>
        count === 1
            ? '1 new order awaiting payment confirmation'
            : `${count} new orders awaiting payment confirmation`,
    description: () =>
        'Customers submitted payment proof. Open Orders, review the proof, then confirm payment.',
    severity: (count: number) => (count >= 5 ? 'error' : 'warning'),
    recheckInterval: 30_000,
    actions: [
        {
            label: 'View orders',
            onClick: ({dismiss}: {dismiss: () => void}) => {
                window.location.assign('/dashboard/orders');
                dismiss();
            },
        },
    ],
};
