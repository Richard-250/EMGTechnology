/** In-memory pending visual search image for SPA navigation (survives client route changes). */

let pendingFile: File | null = null;
let pendingPreviewUrl: string | null = null;

const SESSION_KEY = 'emg-visual-search-preview';

export function setPendingVisualSearchImage(file: File, previewDataUrl?: string) {
    pendingFile = file;
    if (pendingPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingPreviewUrl);
    }
    pendingPreviewUrl = previewDataUrl ?? URL.createObjectURL(file);
    try {
        if (previewDataUrl && previewDataUrl.length < 1_800_000) {
            sessionStorage.setItem(SESSION_KEY, previewDataUrl);
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    } catch {
        // ignore quota errors
    }
}

export function peekPendingVisualSearchFile(): File | null {
    return pendingFile;
}

export function takePendingVisualSearchFile(): File | null {
    const file = pendingFile;
    pendingFile = null;
    return file;
}

export function getPendingVisualSearchPreview(): string | null {
    if (pendingPreviewUrl) return pendingPreviewUrl;
    try {
        return sessionStorage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
}

export function clearPendingVisualSearch() {
    pendingFile = null;
    if (pendingPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingPreviewUrl);
    }
    pendingPreviewUrl = null;
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // ignore
    }
}
