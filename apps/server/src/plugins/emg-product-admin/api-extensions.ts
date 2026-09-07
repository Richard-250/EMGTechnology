import gql from 'graphql-tag';

/** Public shop rate so storefront search cards can match PDP currency. */
export const emgStorefrontShopApiExtensions = gql`
    extend type Query {
        emgStorefrontRwfPerUsd: Float!
    }
`;

export const emgExchangeRateAdminApiExtensions = gql`
    type EmgExchangeRateInfo {
        rwfPerUsd: Float!
    }

    type EmgExchangeRateUpdateResult {
        rwfPerUsd: Float!
        updatedVariants: Int!
    }

    type EmgOrderNotifyAdministrator {
        id: ID!
        firstName: String!
        lastName: String!
        emailAddress: String!
    }

    type EmgOrderNotifySettings {
        orderNotifyMode: String!
        orderNotifyAdministratorIds: String!
        administrators: [EmgOrderNotifyAdministrator!]!
    }

    type EmgConfirmOrderPaymentResult {
        id: ID!
        code: String!
        state: String!
        paymentConfirmedByName: String
        paymentConfirmedAt: DateTime
    }

    extend type Query {
        emgExchangeRate: EmgExchangeRateInfo!
        emgOrderNotifySettings: EmgOrderNotifySettings!
    }

    extend type Mutation {
        """
        Save the RWF-per-USD rate and recalculate catalog prices.
        direction RWF_TO_USD (default) updates USD from RWF; USD_TO_RWF updates RWF from USD.
        """
        emgUpdateExchangeRate(
            rwfPerUsd: Float!
            recalculate: Boolean = true
            direction: String = "RWF_TO_USD"
        ): EmgExchangeRateUpdateResult!

        emgUpdateOrderNotifySettings(
            orderNotifyMode: String!
            orderNotifyAdministratorIds: String
        ): EmgOrderNotifySettings!

        """
        Verify payment proof and settle the order payment. Records who confirmed it.
        Requires ConfirmOrderPayment permission (or SuperAdmin).
        """
        emgConfirmOrderPayment(orderId: ID!, paymentId: ID): EmgConfirmOrderPaymentResult!
    }
`;
