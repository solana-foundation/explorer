export interface DownloadOptions {
    /** MIME type for the file */
    type?: string;
    /** Maximum file size in bytes. Prevents DoS by limiting memory usage. */
    maxSize?: number;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Triggers a file download from a Blob
 *
 * @param blob - Blob to download
 * @param filename - Name for the downloaded file (browsers automatically sanitize this)
 */
const triggerDownloadBlob = (blob: Blob, filename: string): void => {
    let fileDownloadUrl: string | null = null;
    let tempLink: HTMLAnchorElement | null = null;

    try {
        fileDownloadUrl = URL.createObjectURL(blob);

        tempLink = document.createElement('a');
        tempLink.href = fileDownloadUrl;
        // Browsers automatically sanitize the download attribute:
        // - Remove path traversal sequences (../, ..\)
        // - Remove or replace dangerous characters (/, \, <, >, :, ", |, ?, *)
        // - Handle empty filenames by generating defaults
        // - Ensure files are saved to the user's download directory only
        tempLink.setAttribute('download', filename);
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);

        tempLink.click();
    } finally {
        if (fileDownloadUrl) {
            URL.revokeObjectURL(fileDownloadUrl);
        }
        if (tempLink && tempLink.parentNode) {
            tempLink.parentNode.removeChild(tempLink);
        }
    }
};

const isValidBase64 = (str: string): boolean => {
    try {
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(str)) {
            return false;
        }
        Buffer.from(str, 'base64');
        return true;
    } catch {
        return false;
    }
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Triggers a file download from base64 encoded data.
 *
 * @param data - Base64 encoded string
 * @param filename - Name for the downloaded file
 * @param options - Optional configuration object with type and maxSize
 * @throws Error if data is invalid base64 or exceeds maxSize
 */
export const triggerDownload = async (data: string, filename: string, options?: DownloadOptions): Promise<void> => {
    if (!data || typeof data !== 'string') {
        throw new Error('Invalid data: must be a non-empty string');
    }

    if (!isValidBase64(data)) {
        throw new Error('Invalid data: not a valid base64 string');
    }

    const type = options?.type;
    const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

    // Check size BEFORE decoding to prevent DoS via memory exhaustion
    // Base64 encoding increases size by ~33%, so we estimate: base64Length * 3/4
    const estimatedDecodedSize = Math.ceil((data.length * 3) / 4);
    if (estimatedDecodedSize > maxSize) {
        throw new Error(
            `File size (estimated ${formatBytes(estimatedDecodedSize)}) exceeds maximum allowed size (${formatBytes(
                maxSize
            )})`
        );
    }

    const decodedData = Buffer.from(data, 'base64');
    const blob = new Blob([decodedData], type ? { type } : {});

    triggerDownloadBlob(blob, filename);
};

/**
 * Triggers a file download from plain text data.
 *
 * @param text - Plain text string to download
 * @param filename - Name for the downloaded file
 * @param options - Optional configuration object with type and maxSize
 * @throws Error if text is empty or exceeds maxSize
 */
export const triggerDownloadText = async (text: string, filename: string, options?: DownloadOptions): Promise<void> => {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid data: must be a non-empty string');
    }

    const type = options?.type ?? 'text/plain';
    const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;

    if (text.length > maxSize) {
        throw new Error(
            `File size (${formatBytes(text.length)}) exceeds maximum allowed size (${formatBytes(maxSize)})`
        );
    }

    const blob = new Blob([text], { type });
    triggerDownloadBlob(blob, filename);
};
