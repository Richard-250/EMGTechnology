import {connection} from 'next/server';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {isPrerenderAbortError} from '@/lib/prerender';
import {NavbarAccountHover} from '@/components/layout/navbar/navbar-account-hover';

export async function NavbarUserIcon() {
    await connection();

    try {
        const customer = await getActiveCustomer();

        return (
            <NavbarAccountHover
                customer={
                    customer
                        ? {firstName: customer.firstName}
                        : null
                }
            />
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error fetching active customer for navbar:', error);
        }
        return <NavbarAccountHover customer={null} />;
    }
}
