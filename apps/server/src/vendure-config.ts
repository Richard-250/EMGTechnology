import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
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
import { GoogleAuthPlugin } from './plugins/google-auth/google-auth.plugin';

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
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'EmgAdmin2026!Secure',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'emg_production_cookie_secret_998877665544332211',
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
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {},
    plugins: [
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV ? undefined : 'https://www.my-shop.com/assets/',
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            ...(process.env.SMTP_USER && process.env.SMTP_PASS
                ? {
                    transport: {
                        type: 'smtp' as const,
                        host: process.env.SMTP_HOST || 'smtp.gmail.com',
                        port: +(process.env.SMTP_PORT || 587),
                        secure: false,
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
                ...defaultEmailHandlers.filter(handler => handler.type !== 'email-verification'),
                signupOtpHandler,
            ],
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                fromAddress: `"EMG Technology Ltd" <${process.env.SMTP_USER || 'noreply@emgtechnology.rw'}>`,
                verifyEmailAddressUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/verify`
                    : 'http://localhost:3002/verify',
                passwordResetUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/reset-password`
                    : 'http://localhost:3002/reset-password',
                changeEmailAddressUrl: process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL}/verify-email-address-change`
                    : 'http://localhost:3002/verify-email-address-change',
            },
        }),
        DashboardPlugin.init({
            route: 'dashboard',
            appDir: IS_DEV
                ? path.join(__dirname, '../dist/dashboard')
                : path.join(__dirname, 'dashboard'),
            // Port 3001 must serve the built dashboard (fast). Vite dev runs on 5173 only.
            // If this matched 5173, opening localhost:3001/dashboard would proxy to Vite (~3000 modules).
            viteDevServerPort: +(process.env.DASHBOARD_VITE_PORT || 51799),
        }),
        EmgBrandingPlugin,
        EmailOtpPlugin,
        GoogleAuthPlugin.init({
            googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        }),
    ],
};
