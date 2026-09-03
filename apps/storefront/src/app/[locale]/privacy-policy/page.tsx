import type {Metadata} from 'next';
import Link from 'next/link';
import {LegalList, LegalPage, LegalSection} from '@/components/legal/legal-page';
import {COMPANY} from '@/lib/company';
import {buildCanonicalUrl, SITE_NAME} from '@/lib/metadata';

export const metadata: Metadata = {
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
        'How EMGTechnology collects, uses, and protects personal information, including Google Sign-In data.',
    alternates: {
        canonical: buildCanonicalUrl('/privacy-policy'),
    },
};

export default function PrivacyPolicyPage() {
    return (
        <LegalPage title="Privacy Policy" effectiveDate="September 2, 2026">
            <p>
                EMGTechnology (“EMGTechnology,” “we,” “our,” or “us”) operates the website{' '}
                <a href="https://emgtechnologyltd.com/" className="text-electric hover:underline underline-offset-4">
                    https://emgtechnologyltd.com/
                </a>{' '}
                and provides an online store for gym equipment, sports clothing, fitness products, and other
                sports-related products in Rwanda.
            </p>
            <p>
                We respect your privacy and are committed to protecting the personal information you provide when
                using our website, creating an account, signing in, placing an order, or communicating with us.
            </p>
            <p>
                This Privacy Policy explains what information we collect, how we use it, how we protect it, and your
                rights regarding your personal information.
            </p>

            <LegalSection title="1. Information We Collect">
                <p>We may collect information that you provide directly to us when you use EMGTechnology, including:</p>
                <LegalList
                    items={[
                        'Your name',
                        'Email address',
                        'Phone number',
                        'Delivery or billing address',
                        'Account information',
                        'Order and purchase information',
                        'Information you provide when contacting us',
                        'Other information necessary to process and deliver your orders',
                    ]}
                />
                <p>
                    We may also collect certain technical information automatically when you use our website, such as
                    your IP address, browser type, device information, and information about how you interact with our
                    website.
                </p>
            </LegalSection>

            <LegalSection title="2. Sign in with Google">
                <p>
                    EMGTechnology allows customers to create an account and sign in using their Google account through
                    Google&apos;s OAuth authentication service.
                </p>
                <p>
                    When you choose “Continue with Google,” we may receive the following information from your Google
                    account:
                </p>
                <LegalList
                    items={['Your name', 'Your email address', 'Your Google profile picture']}
                />
                <p>We use this information only to:</p>
                <LegalList
                    items={[
                        'Create or identify your EMGTechnology customer account',
                        'Authenticate and sign you into your account',
                        'Display your account information within our website',
                        'Help you manage your orders and customer account',
                        'Provide and improve the account and shopping functionality of EMGTechnology',
                    ]}
                />
                <p>We do not sell your Google user data.</p>
                <p>We do not use Google user data for targeted advertising or personalized advertising.</p>
                <p>
                    We do not use Google user data to determine your creditworthiness or for lending purposes.
                </p>
                <p>We do not sell Google user data to data brokers or information resellers.</p>
                <p>
                    We do not use Google user data for purposes unrelated to providing the services and functionality of
                    EMGTechnology.
                </p>
                <p>
                    Our use of information received through Google APIs is limited to the purposes described in this
                    Privacy Policy and applicable Google API Services User Data Policy requirements.
                </p>
            </LegalSection>

            <LegalSection title="3. How We Use Your Information">
                <p>We may use your personal information to:</p>
                <LegalList
                    items={[
                        'Create and manage your customer account',
                        'Authenticate your account when you sign in',
                        'Process and manage your orders',
                        'Process payments and confirm payment status',
                        'Arrange delivery of purchased products',
                        'Contact you about your orders',
                        'Respond to customer service requests',
                        'Provide information about your account',
                        'Improve our website, products, and services',
                        'Prevent fraud, abuse, and unauthorized activity',
                        'Comply with applicable laws and legal obligations',
                    ]}
                />
                <p>
                    We only collect and use information that is reasonably necessary for operating our e-commerce
                    business and providing services to our customers.
                </p>
            </LegalSection>

            <LegalSection title="4. Payments">
                <p>
                    EMGTechnology may accept payments through mobile money services, including MTN Mobile Money and
                    Airtel Money.
                </p>
                <p>
                    When you make a payment, certain payment-related information may be processed by the relevant
                    payment service provider. We do not claim ownership or control over the privacy practices of MTN,
                    Airtel, or other third-party payment providers.
                </p>
                <p>
                    Customers should review the privacy policies of the applicable payment provider for information
                    about how that provider handles payment-related information.
                </p>
            </LegalSection>

            <LegalSection title="5. Orders and Delivery">
                <p>
                    When you place an order, we may use information such as your name, phone number, email address, and
                    delivery address to process, confirm, and deliver your order.
                </p>
                <p>
                    We may share the information necessary to complete an order with service providers involved in
                    payment processing, order fulfillment, delivery, or other services required to operate our business.
                </p>
                <p>
                    We only share information when reasonably necessary to provide the requested service or fulfill our
                    business and legal obligations.
                </p>
            </LegalSection>

            <LegalSection title="6. Information Sharing">
                <p>We do not sell your personal information.</p>
                <p>We may share limited personal information with trusted service providers when necessary to:</p>
                <LegalList
                    items={[
                        'Process payments',
                        'Deliver orders',
                        'Operate and maintain our website',
                        'Provide technical services',
                        'Prevent fraud or unauthorized activity',
                        'Comply with legal requirements',
                    ]}
                />
                <p>
                    We require service providers that handle personal information on our behalf to use that information
                    only for the purposes for which it was provided or as otherwise permitted by law.
                </p>
            </LegalSection>

            <LegalSection title="7. Cookies and Similar Technologies">
                <p>
                    EMGTechnology may use cookies or similar technologies to help operate our website, maintain customer
                    sessions, remember preferences, improve website functionality, and understand how visitors use our
                    website.
                </p>
                <p>
                    You may be able to control or disable cookies through your browser settings. Disabling certain
                    cookies may affect some website functionality.
                </p>
            </LegalSection>

            <LegalSection title="8. Data Security">
                <p>
                    We take reasonable technical and organizational measures to protect personal information against
                    unauthorized access, alteration, disclosure, loss, or misuse.
                </p>
                <p>
                    However, no internet transmission or electronic storage system can be guaranteed to be completely
                    secure. Therefore, while we take reasonable measures to protect your information, we cannot
                    guarantee absolute security.
                </p>
            </LegalSection>

            <LegalSection title="9. Data Retention">
                <p>
                    We retain personal information for as long as reasonably necessary to provide our services, maintain
                    customer accounts, process and maintain records of orders, resolve disputes, prevent fraud, comply
                    with legal obligations, and enforce our agreements.
                </p>
                <p>
                    When personal information is no longer reasonably required for these purposes, we may delete,
                    anonymize, or securely dispose of it, subject to applicable legal and business requirements.
                </p>
            </LegalSection>

            <LegalSection title="10. Your Rights">
                <p>
                    Depending on applicable law, you may have rights concerning your personal information, including the
                    right to:
                </p>
                <LegalList
                    items={[
                        'Request access to personal information we hold about you',
                        'Request correction of inaccurate or incomplete information',
                        'Request deletion of your personal information',
                        'Request information about how your personal information is used',
                        'Withdraw consent where processing is based on consent',
                        'Request assistance with closing or deleting your account',
                    ]}
                />
                <p>
                    To request deletion of your EMGTechnology account or personal information, please contact
                    EMGTechnology through the contact details provided on our website.
                </p>
                <p>
                    Some information may need to be retained where required by law or where reasonably necessary for
                    legitimate business purposes, such as resolving disputes or maintaining transaction records.
                </p>
            </LegalSection>

            <LegalSection title="11. Google Account Data Deletion">
                <p>
                    If you used Google to sign in to EMGTechnology and would like your account or information associated
                    with your EMGTechnology account deleted, you may contact us through our website to request deletion.
                </p>
                <p>
                    Upon receiving a valid deletion request, we will take reasonable steps to delete the applicable
                    personal information, except where we are required or permitted to retain certain information by
                    applicable law or for legitimate business purposes.
                </p>
                <p>
                    Deleting your EMGTechnology account may prevent you from accessing your previous account
                    information, order history, or other account-related services.
                </p>
            </LegalSection>

            <LegalSection title="12. Children's Privacy">
                <p>
                    EMGTechnology is an e-commerce website intended for general consumers. We do not knowingly collect
                    personal information from children where such collection is prohibited by applicable law.
                </p>
                <p>
                    If you believe that a child has provided personal information to us improperly, please contact us so
                    that we can review and take appropriate action.
                </p>
            </LegalSection>

            <LegalSection title="13. Third-Party Services">
                <p>
                    Our website may use third-party services necessary to provide authentication, payments, hosting,
                    analytics, delivery, security, or other website functionality.
                </p>
                <p>
                    These third parties may process information according to their own privacy policies and applicable
                    laws.
                </p>
                <p>Our use of Google Sign-In is subject to Google&apos;s applicable policies and requirements.</p>
            </LegalSection>

            <LegalSection title="14. Changes to This Privacy Policy">
                <p>
                    We may update this Privacy Policy from time to time to reflect changes to our business, website,
                    services, technology, or legal requirements.
                </p>
                <p>
                    When we make changes, we will update the effective date shown at the beginning of this Privacy
                    Policy.
                </p>
                <p>We encourage customers to review this Privacy Policy periodically.</p>
            </LegalSection>

            <LegalSection title="15. Contact Us">
                <p>
                    If you have questions about this Privacy Policy, your personal information, Google Sign-In, or a
                    request to delete your information, please contact EMGTechnology through the contact information
                    provided on{' '}
                    <a href="https://emgtechnologyltd.com/" className="text-electric hover:underline underline-offset-4">
                        https://emgtechnologyltd.com/
                    </a>
                    .
                </p>
                <p>
                    {COMPANY.legalName}
                    <br />
                    Rwanda
                    <br />
                    Email:{' '}
                    <a href={`mailto:${COMPANY.email}`} className="text-electric hover:underline underline-offset-4">
                        {COMPANY.email}
                    </a>
                    <br />
                    Website:{' '}
                    <a href="https://emgtechnologyltd.com/" className="text-electric hover:underline underline-offset-4">
                        https://emgtechnologyltd.com/
                    </a>
                </p>
                <p>
                    Related:{' '}
                    <Link href="/en/terms-of-service" className="text-electric hover:underline underline-offset-4">
                        Terms of Service
                    </Link>
                </p>
            </LegalSection>
        </LegalPage>
    );
}
