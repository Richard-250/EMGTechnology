import sharp from 'sharp';

const BINS = 4;
const HIST_SIZE = BINS * BINS * BINS;

function quantize(value: number): number {
    return Math.min(BINS - 1, Math.floor((value / 256) * BINS));
}

/** Build a normalized RGB histogram signature from an image buffer. */
export async function buildImageSignature(buffer: Buffer): Promise<Float32Array> {
    const {data} = await sharp(buffer)
        .rotate()
        .resize(48, 48, {fit: 'fill'})
        .removeAlpha()
        .raw()
        .toBuffer({resolveWithObject: true});

    const hist = new Float32Array(HIST_SIZE);
    for (let i = 0; i < data.length; i += 3) {
        const r = quantize(data[i]);
        const g = quantize(data[i + 1]);
        const b = quantize(data[i + 2]);
        hist[r * BINS * BINS + g * BINS + b] += 1;
    }

    let sum = 0;
    for (let i = 0; i < hist.length; i++) sum += hist[i];
    if (sum > 0) {
        for (let i = 0; i < hist.length; i++) hist[i] /= sum;
    }
    return hist;
}

/** Cosine similarity in [0, 1] between two histogram signatures. */
export function signatureSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
