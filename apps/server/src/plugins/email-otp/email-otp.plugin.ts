import gql from 'graphql-tag';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { SignupOtp } from './signup-otp.entity';
import { SignupOtpResolver } from './signup-otp.resolver';
import { SignupOtpService } from './signup-otp.service';

const shopApiExtensions = gql`
    type CompleteSignupResult {
        success: Boolean!
        message: String!
        alreadyComplete: Boolean
    }

    extend type Mutation {
        requestSignupOtp(email: String!, firstName: String!, lastName: String!): Boolean!
        verifySignupOtp(email: String!, code: String!): Boolean!
        completeSignup(email: String!, password: String!, phoneNumber: String): CompleteSignupResult!
    }
`;

@VendurePlugin({
    imports: [PluginCommonModule],
    entities: [SignupOtp],
    providers: [SignupOtpService],
    shopApiExtensions: {
        schema: shopApiExtensions,
        resolvers: [SignupOtpResolver],
    },
})
export class EmailOtpPlugin {}
