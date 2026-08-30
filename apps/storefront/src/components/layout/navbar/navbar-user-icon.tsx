import {getRouteLocale} from '@/i18n/server';

import {getActiveCustomer} from '@/lib/vendure/actions';

import {NavbarAccountHover} from '@/components/layout/navbar/navbar-account-hover';



export async function NavbarUserIcon() {

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

}

