import gql from 'graphql-tag';

export const emgExchangeRateAdminApiExtensions = gql`
    type EmgExchangeRateInfo {
        rwfPerUsd: Float!
    }

    type EmgExchangeRateUpdateResult {
        rwfPerUsd: Float!
        updatedVariants: Int!
    }

    extend type Query {
        emgExchangeRate: EmgExchangeRateInfo!
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
    }
`;
