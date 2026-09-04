import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    LanguageCode,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { DashboardPlugin } from '@vendure/dashboard/plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import 'dotenv/config';
import path from 'path';
import { EmgBrandingPlugin } from './plugins/emg-branding/emg-branding.plugin';
import { EmailOtpPlugin } from './plugins/email-otp/email-otp.plugin';
import { signupOtpHandler } from './plugins/email-otp/signup-otp.handler';
import { adminOrderNotificationHandler } from './plugins/email-otp/admin-order.handler';
import { GoogleAuthPlugin } from './plugins/google-auth/google-auth.plugin';
import { EmailChangeBlockPlugin } from './plugins/email-change-block/email-change-block.plugin';
import { EmgDiscountPlugin } from './plugins/emg-discount/emg-discount.plugin';
import { EmgProductAdminPlugin } from './plugins/emg-product-admin/emg-product-admin.plugin';
// Cloudinary plugin temporarily disabled — native asset upload must stay on local AssetServerPlugin.
// import { EmgCloudinaryAssetPlugin } from './plugins/emg-cloudinary-asset/emg-cloudinary-asset.plugin';
import { assertBuiltDashboardInProduction, resolveDashboardAppDir } from './resolve-dashboard-app-dir';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3001;

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        trustProxy: IS_DEV ? false : 1,
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        requireVerification: true,
        sessionDuration: '7d',
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'EmgAdmin2026!Secure',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'emg_production_cookie_secret_998877665544332211',
            ...(IS_DEV
                ? {}
                : {
                    secure: true,
                    sameSite: 'lax' as const,
                }),
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: +(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'emg_admin',
        password: process.env.DB_PASSWORD || 'emg_dev_password',
        database: process.env.DB_NAME || 'emgtechnology',
        // Use synchronization for setup or local development
        synchronize: process.env.DB_SYNCHRONIZE === 'true' || IS_DEV,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    importExportOptions: {
        importAssetsDir: path.join(__dirname, '../assets/import'),
    },
    // Custom fields for admin discount and super deals management
    customFields: {
        Customer: [
            {
                name: 'googleUserId',
                type: 'string',
                public: false,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Google User ID' }],
            },
            {
                name: 'googleProfileImageUrl',
                type: 'string',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'Google Profile Image URL' }],
            },
        ],
        Product: [
            {
                name: 'isDiscounted',
                type: 'boolean',
                defaultValue: false,
                label: [{ languageCode: LanguageCode.en, value: 'Super Deal / Discounted' }],
                description: [{ languageCode: LanguageCode.en, value: 'Feature in Super Deals until you remove it or the product is deleted' }],
            },
            {
                name: 'discountType',
                type: 'string',
                defaultValue: 'percentage',
                label: [{ languageCode: LanguageCode.en, value: 'Discount Type' }],
                description: [{ languageCode: LanguageCode.en, value: 'percentage or fixed' }],
                options: [
                    { value: 'percentage', label: [{ languageCode: LanguageCode.en, value: 'Percentage (%)' }] },
                    { value: 'fixed', label: [{ languageCode: LanguageCode.en, value: 'Fixed amount' }] },
                ],
            },
            {
                name: 'discountPercentage',
                type: 'int',
                min: 1,
                max: 99,
                label: [{ languageCode: LanguageCode.en, value: 'Discount Percentage (%)' }],
                description: [{ languageCode: LanguageCode.en, value: 'Used when discount type is percentage' }],
            },
            {
                name: 'discountAmount',
                type: 'int',
                min: 1,
                label: [{ languageCode: LanguageCode.en, value: 'Discount Amount (major units)' }],
                description: [{ languageCode: LanguageCode.en, value: 'Fixed amount off in RWF/USD major units (e.g. 5000)' }],
            },
            {
                name: 'originalPrice',
                type: 'int',
                label: [{ languageCode: LanguageCode.en, value: 'Original Price Before Discount' }],
                description: [{ languageCode: LanguageCode.en, value: 'Auto-filled from variant price when Super Deal is enabled' }],
            },
        ],
        ProductVariant: [
            {
                name: 'variantDiscountPercentage',
                type: 'int',
                min: 0,
                max: 99,
                label: [{ languageCode: LanguageCode.en, value: 'Variant Discount (%)' }],
                description: [{ languageCode: LanguageCode.en, value: 'Optional override for this variant. Leave empty to use product discount.' }],
            },
            {
                name: 'variantDiscountAmount',
                type: 'int',
                min: 0,
                label: [{ languageCode: LanguageCode.en, value: 'Variant Fixed Discount' }],
                description: [{ languageCode: LanguageCode.en, value: 'Optional fixed amount off for this variant (major units)' }],
            },
            {
                name: 'variantOriginalPrice',
                type: 'int',
                min: 0,
                label: [{ languageCode: LanguageCode.en, value: 'Variant Original Price' }],
                description: [{ languageCode: LanguageCode.en, value: 'Auto-filled from this variant price. Override if needed.' }],
            },
        ],
        Order: [
            {
                name: 'deliveryDate',
                type: 'string',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'Delivery Date / Time' }],
                description: [{ languageCode: LanguageCode.en, value: 'Customer chosen delivery date for order fulfillment' }],
            },
        ],
        Asset: [
            {
                name: 'cloudinaryPublicId',
                type: 'string',
                public: true,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Cloudinary public ID' }],
                description: [{ languageCode: LanguageCode.en, value: 'Cloudinary asset identifier (publicId)' }],
            },
            {
                name: 'cloudinarySecureUrl',
                type: 'string',
                public: true,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Media URL' }],
                description: [{ languageCode: LanguageCode.en, value: 'Secure Cloudinary CDN URL stored in the database' }],
            },
            {
                name: 'cloudinaryResourceType',
                type: 'string',
                public: true,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Resource type' }],
                description: [{ languageCode: LanguageCode.en, value: 'image or video' }],
            },
            {
                name: 'cloudinaryFormat',
                type: 'string',
                public: true,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Format' }],
            },
            {
                name: 'cloudinaryDuration',
                type: 'float',
                public: true,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Duration (seconds)' }],
                description: [{ languageCode: LanguageCode.en, value: 'Video duration where applicable' }],
            },
            {
                name: 'cloudinaryFolder',
                type: 'string',
                public: false,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Cloudinary folder' }],
            },
            {
                name: 'sourceImageUrl',
                type: 'string',
                public: false,
                readonly: true,
                label: [{ languageCode: LanguageCode.en, value: 'Original source URL' }],
                description: [{ languageCode: LanguageCode.en, value: 'URL pasted by admin when importing from link' }],
            },
        ],
        PaymentMethod: [
            {
                name: 'merchantDisplayName',
                type: 'string',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'Registered account name' }],
                description: [{ languageCode: LanguageCode.en, value: 'Name registered to the MoMo / merchant number (shown to customers at checkout)' }],
            },
            {
                name: 'merchantPhone',
                type: 'string',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'MoMo / payment phone number' }],
                description: [{ languageCode: LanguageCode.en, value: 'Phone number customers pay to (e.g. +250796345773)' }],
            },
            {
                name: 'merchantMomoCode',
                type: 'string',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'USSD / MoMo code' }],
                description: [{ languageCode: LanguageCode.en, value: 'Dial code customers use (e.g. *182*8*00000#)' }],
            },
            {
                name: 'paymentSteps',
                type: 'text',
                public: true,
                label: [{ languageCode: LanguageCode.en, value: 'Payment instructions' }],
                description: [{ languageCode: LanguageCode.en, value: 'One instruction per line, shown to customers at checkout' }],
            },
        ],
    },
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // In production, assetUrlPrefix MUST be a full absolute URL (e.g. https://emgtechnologyltd.com/assets/)
            // so that Vendure Dashboard image preview URL constructors (new URL(asset.preview)) succeed without errors.
            assetUrlPrefix: IS_DEV
                ? undefined
                : (process.env.ASSET_URL_PREFIX ||
                    (process.env.STOREFRONT_URL
                        ? `${process.env.STOREFRONT_URL.replace(/\/$/, '')}/assets/`
                        : 'https://emgtechnologyltd.com/assets/')),
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            ...(process.env.SMTP_USER && process.env.SMTP_PASS
                ? {
                    transport: {
                        type: 'smtp' as const,
                        host: process.env.SMTP_HOST || 'smtp.resend.com',
                        port: +(process.env.SMTP_PORT || 465),
                        secure: +(process.env.SMTP_PORT || 465) === 465,
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
                        },
                    },
                }
                : {
                    devMode: true,
                    outputPath: path.join(__dirname, '../static/email/test-emails'),
                    route: 'mailbox',
                }),
            handlers: [
                ...defaultEmailHandlers.filter(
                    handler => handler.type !== 'email-verification' && handler.type !== 'email-address-change',
                ),
                signupOtpHandler,
                adminOrderNotificationHandler,
            ],
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: process.env.EMAIL_FROM || `"EMG Technology Ltd" <${process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'info@emgtechnologyltd.com'}>`,
                verifyEmailAddressUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/verify`
                    : 'https://emgtechnologyltd.com/verify',
                passwordResetUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/reset-password`
                    : 'https://emgtechnologyltd.com/reset-password',
                changeEmailAddressUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/verify-email-address-change`
                    : 'https://emgtechnologyltd.com/verify-email-address-change',
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: (() => {
                const appDir = resolveDashboardAppDir(__dirname);
                assertBuiltDashboardInProduction(appDir);
                return appDir;
            })(),
            viteDevServerPort: +(process.env.DASHBOARD_VITE_PORT || 51799),
        }),
        EmgBrandingPlugin,
        EmailOtpPlugin,
        GoogleAuthPlugin.init({
            googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        }),
        EmailChangeBlockPlugin,
        EmgDiscountPlugin,
        EmgProductAdminPlugin,
        // EmgCloudinaryAssetPlugin — disabled until native createAssets is confirmed working on production
    ],
};
