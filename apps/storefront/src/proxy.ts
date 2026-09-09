import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const middleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;
    // Metadata routes must bypass locale redirects.
    if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
        return NextResponse.next();
    }
    return middleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/robots.txt', '/sitemap.xml'],
};
