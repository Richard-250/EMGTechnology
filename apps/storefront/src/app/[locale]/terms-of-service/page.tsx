import type {Metadata} from 'next';
import Link from 'next/link';
import {LegalList, LegalPage, LegalSection} from '@/components/legal/legal-page';
import {COMPANY} from '@/lib/company';
import {buildCanonicalUrl, SITE_NAME} from '@/lib/metadata';

export const metadata: Metadata = {
    title: `Terms of Service | ${SITE_NAME}`,
    description:
        'Terms governing access to EMGTechnology, account use, orders, payments, delivery, and Google Sign-In.',
    alternates: {
        canonical: buildCanonicalUrl('/terms-of-service'),
    },
};

export default function TermsOfServicePage() {
    return (
        <LegalPage title="Terms of Service" effectiveDate="September 2, 2026">
            <p>Welcome to EMGTechnology.</p>
            <p>
                These Terms of Service (“Terms”) govern your access to and use of the EMGTechnology website at{' '}
                <a href="https://emgtechnologyltd.com/" className="text-electric hover:underline underline-offset-4">
                    https://emgtechnologyltd.com/
                </a>{' '}
                and your purchase of products through our online store.
            </p>
            <p>
                By accessing our website, creating an account, signing in, or placing an order, you agree to these
                Terms. If you do not agree with these Terms, please do not use our website.
            </p>

            <LegalSection title="1. About EMGTechnology">
                <p>
                    EMGTechnology is an e-commerce business based in Rwanda that sells gym equipment, fitness products,
                    sports clothing, and other sports-related products.
                </p>
                <p>
                    Our website allows customers to browse products, create accounts, place orders, and arrange payment
                    and delivery.
                </p>
            </LegalSection>

            <LegalSection title="2. Eligibility">
                <p>You must provide accurate information when creating an account or placing an order.</p>
                <p>
                    By using our website, you represent that you have the legal capacity to enter into these Terms under
                    applicable law.
                </p>
                <p>
                    If you are using the website on behalf of another person or organization, you represent that you have
                    authority to act on their behalf.
                </p>
            </LegalSection>

            <LegalSection title="3. Customer Accounts">
                <p>
                    Customers may create an account on EMGTechnology using their email address or by using the “Continue
                    with Google” sign-in option.
                </p>
                <p>
                    If you use Google Sign-In, we may receive your name, email address, and Google profile picture as
                    described in our Privacy Policy.
                </p>
                <p>
                    You are responsible for maintaining the security of your account and for the activities carried out
                    through your account.
                </p>
                <p>
                    You should notify us promptly if you believe your account has been accessed without authorization.
                </p>
            </LegalSection>

            <LegalSection title="4. Products">
                <p>
                    We make reasonable efforts to ensure that product descriptions, images, prices, availability, sizes,
                    colors, specifications, and other information displayed on our website are accurate.
                </p>
                <p>
                    However, product images may vary slightly from the actual product due to differences in screens,
                    lighting, photography, manufacturing batches, or other factors.
                </p>
                <p>
                    We reserve the right to correct errors, update product information, change prices, or modify product
                    availability at any time.
                </p>
            </LegalSection>

            <LegalSection title="5. Orders">
                <p>
                    When you place an order through EMGTechnology, you are submitting a request to purchase the selected
                    products.
                </p>
                <p>An order is subject to product availability and confirmation by EMGTechnology.</p>
                <p>
                    We reserve the right to refuse, cancel, or limit an order where reasonably necessary, including
                    where:
                </p>
                <LegalList
                    items={[
                        'A product is unavailable',
                        'There is an obvious pricing or product information error',
                        'We suspect fraudulent or unauthorized activity',
                        'The requested delivery information is incomplete or inaccurate',
                        'We are unable to complete the order for operational or legal reasons',
                    ]}
                />
                <p>
                    If we cancel an order after payment has been made, we will take reasonable steps to arrange the
                    appropriate refund or resolution.
                </p>
            </LegalSection>

            <LegalSection title="6. Prices">
                <p>Product prices displayed on our website are subject to change.</p>
                <p>
                    The price applicable to an order will generally be the price displayed when the order is placed,
                    unless there is an obvious error or another issue requiring correction.
                </p>
                <p>
                    Any applicable delivery charges or other charges will be communicated to the customer as part of the
                    ordering process where applicable.
                </p>
            </LegalSection>

            <LegalSection title="7. Payments">
                <p>EMGTechnology may accept payments through MTN Mobile Money and Airtel Money.</p>
                <p>
                    Customers are responsible for providing accurate payment information and completing the required
                    payment process.
                </p>
                <p>
                    An order may not be processed or delivered until the required payment has been successfully
                    confirmed.
                </p>
                <p>
                    Payment processing may be subject to the terms and conditions of the applicable payment provider.
                </p>
            </LegalSection>

            <LegalSection title="8. Delivery">
                <p>
                    We will use reasonable efforts to deliver orders to the delivery location provided by the customer.
                </p>
                <p>
                    Customers are responsible for providing accurate delivery information, including their name, phone
                    number, address, and other information necessary to locate the delivery destination.
                </p>
                <p>
                    Delivery times may vary depending on product availability, location, transportation, weather,
                    operational conditions, and other circumstances.
                </p>
                <p>We are not responsible for delays caused by circumstances outside our reasonable control.</p>
            </LegalSection>

            <LegalSection title="9. Returns, Refunds, and Exchanges">
                <p>
                    Returns, refunds, and exchanges are subject to EMGTechnology&apos;s applicable return policy and any
                    rights provided to customers under applicable Rwandan law.
                </p>
                <p>
                    Customers should inspect products upon delivery and contact EMGTechnology as soon as reasonably
                    possible if an item is damaged, defective, incorrect, or otherwise does not match the order.
                </p>
                <p>
                    Where a return, refund, or exchange is approved, we will provide the customer with instructions for
                    completing the process.
                </p>
                <p>
                    Certain products may not be eligible for return or exchange where permitted by applicable law,
                    including products that have been used, damaged after delivery, or otherwise do not meet the
                    applicable return conditions.
                </p>
            </LegalSection>

            <LegalSection title="10. Customer Responsibilities">
                <p>You agree not to:</p>
                <LegalList
                    items={[
                        'Use the website for unlawful purposes',
                        'Provide false or misleading information',
                        'Attempt to gain unauthorized access to customer accounts, systems, or data',
                        'Interfere with the operation or security of the website',
                        'Use automated systems to abuse or overload the website',
                        'Engage in fraudulent purchasing activity',
                        'Copy, reproduce, distribute, or misuse website content without authorization',
                    ]}
                />
                <p>
                    We reserve the right to restrict or terminate access to accounts that violate these Terms or are
                    involved in fraudulent, abusive, or unlawful activity.
                </p>
            </LegalSection>

            <LegalSection title="11. Intellectual Property">
                <p>
                    Unless otherwise stated, the EMGTechnology website, including its branding, logos, text, graphics,
                    product descriptions, images, design, software, and other content, is owned by or licensed to
                    EMGTechnology and is protected by applicable intellectual property laws.
                </p>
                <p>You may access and use the website for personal and legitimate shopping purposes.</p>
                <p>
                    You may not reproduce, modify, distribute, sell, or commercially exploit our website content without
                    our prior written permission, except where permitted by law.
                </p>
            </LegalSection>

            <LegalSection title="12. Third-Party Services">
                <p>
                    Our website may rely on third-party services, including Google for authentication and MTN or Airtel
                    for payment services.
                </p>
                <p>Third-party services may be subject to their own terms and policies.</p>
                <p>
                    EMGTechnology is not responsible for the independent operation, availability, or policies of
                    third-party services, except to the extent required by applicable law.
                </p>
            </LegalSection>

            <LegalSection title="13. Privacy">
                <p>
                    Your use of EMGTechnology is also governed by our Privacy Policy, which explains how we collect, use,
                    store, and protect personal information.
                </p>
                <p>
                    Our Privacy Policy is available at:{' '}
                    <Link href="/en/privacy-policy" className="text-electric hover:underline underline-offset-4">
                        https://emgtechnologyltd.com/privacy-policy
                    </Link>
                </p>
            </LegalSection>

            <LegalSection title="14. Website Availability">
                <p>
                    We aim to keep our website available and functioning properly, but we do not guarantee that the
                    website will always be available, uninterrupted, error-free, or free from security vulnerabilities.
                </p>
                <p>
                    We may temporarily suspend or modify the website for maintenance, security, updates, improvements, or
                    other operational reasons.
                </p>
            </LegalSection>

            <LegalSection title="15. Limitation of Liability">
                <p>
                    To the extent permitted by applicable law, EMGTechnology will not be responsible for indirect,
                    incidental, special, or consequential losses arising from the use of our website or services.
                </p>
                <p>
                    Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under
                    applicable law.
                </p>
            </LegalSection>

            <LegalSection title="16. Changes to These Terms">
                <p>
                    We may update these Terms from time to time to reflect changes to our business, website, products,
                    services, or applicable legal requirements.
                </p>
                <p>
                    Updated Terms will be published on this page, together with a revised effective date.
                </p>
                <p>
                    Your continued use of the website after changes are published constitutes acceptance of the updated
                    Terms, to the extent permitted by applicable law.
                </p>
            </LegalSection>

            <LegalSection title="17. Governing Law">
                <p>
                    These Terms shall be interpreted and applied in accordance with the applicable laws of the Republic
                    of Rwanda.
                </p>
                <p>
                    Any disputes relating to these Terms or your use of EMGTechnology shall be handled in accordance with
                    applicable Rwandan law and the jurisdiction of the appropriate courts or authorities.
                </p>
            </LegalSection>

            <LegalSection title="18. Contact Us">
                <p>
                    If you have questions regarding these Terms, an order, a product, a return, payment, or any other
                    matter concerning EMGTechnology, please contact us using the contact information provided on our
                    website.
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
            </LegalSection>
        </LegalPage>
    );
}
