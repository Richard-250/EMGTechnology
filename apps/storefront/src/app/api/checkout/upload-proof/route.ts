import {NextRequest, NextResponse} from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Default Cloudinary credentials from project config (can be overridden by env)
const DEFAULT_CLOUD_NAME = 'sugamvn4';
const DEFAULT_API_KEY = '115874335927736';
const DEFAULT_API_SECRET = 'yuDRsigvGr0o6Be6LsY-lY1ORtw';

async function uploadToCloudinary(dataUrl: string): Promise<string | null> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY || DEFAULT_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || DEFAULT_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return null;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'emg/payment-proofs';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.warn('Cloudinary upload returned non-200:', res.status, errorText);
        return null;
    }

    const json = (await res.json()) as {secure_url?: string; url?: string};
    return json.secure_url || json.url || null;
}

async function saveToLocalUploads(
    dataUrl: string,
    req: NextRequest,
): Promise<string | null> {
    try {
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',').pop() || '' : dataUrl;
        const buffer = Buffer.from(base64Data, 'base64');
        if (!buffer.length) return null;

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
        await fs.mkdir(uploadsDir, {recursive: true});

        const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
        const fileName = `proof-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, buffer);

        // Build absolute or relative URL
        const origin =
            process.env.NEXT_PUBLIC_SITE_URL ||
            req.nextUrl.origin ||
            'https://emgtechnologyltd.com';
        return `${origin.replace(/\/$/, '')}/uploads/payment-proofs/${fileName}`;
    } catch (err) {
        console.warn('Could not save payment proof to local disk:', err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            fileBase64?: string;
            fileName?: string;
            mimeType?: string;
        };

        const dataUrl = body.fileBase64?.trim();
        if (!dataUrl) {
            return NextResponse.json(
                {error: 'No image data provided'},
                {status: 400},
            );
        }

        // 1. Try Cloudinary direct upload
        try {
            const cloudinaryUrl = await uploadToCloudinary(dataUrl);
            if (cloudinaryUrl) {
                return NextResponse.json({url: cloudinaryUrl, provider: 'cloudinary'});
            }
        } catch (cloudErr) {
            console.warn('Cloudinary upload error:', cloudErr);
        }

        // 2. Try local filesystem upload
        const localUrl = await saveToLocalUploads(dataUrl, req);
        if (localUrl) {
            return NextResponse.json({url: localUrl, provider: 'local'});
        }

        // 3. Last-resort fallback: return the compressed data URL directly so checkout NEVER fails
        return NextResponse.json({url: dataUrl, provider: 'inline'});
    } catch (err) {
        console.error('Error handling payment proof upload:', err);
        return NextResponse.json(
            {error: 'Failed to process payment proof image'},
            {status: 500},
        );
    }
}
