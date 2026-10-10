import {NextResponse} from 'next/server';

export const dynamic = 'force-dynamic';

/** Cheap liveness check for nginx/PM2 — does not call Vendure. */
export function GET() {
    return NextResponse.json(
        {ok: true, service: 'emg-storefront', ts: Date.now()},
        {headers: {'Cache-Control': 'no-store'}},
    );
}
