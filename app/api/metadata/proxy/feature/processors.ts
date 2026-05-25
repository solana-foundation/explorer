import { Logger } from '@/app/shared/lib/logger';

import { matchMaxSizeError, statusError } from './errors';

/**
 * process binary data and catch any specific errors
 */
export async function processBinary(data: Response) {
    const headers = data.headers;

    try {
        // request binary data to check for max-size excess
        const buffer = await data.arrayBuffer();

        return { data: buffer, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw statusError(413, 'Binary body exceeds max size', { cause: error });
        }
        Logger.debug('[api:metadata-proxy] Failed to process binary data', { error });
        throw statusError(500, 'Failed to process binary data', { cause: error });
    }
}

/**
 * process text data as json and handle specific errors
 */
export async function processJson(data: Response) {
    const headers = data.headers;

    try {
        const json = await data.json();

        return { data: json, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw statusError(413, 'JSON body exceeds max size', { cause: error });
        } else if (error instanceof SyntaxError) {
            // Handle JSON syntax errors specifically
            throw statusError(415, 'Malformed JSON in upstream response', { cause: error });
        }
        Logger.debug('[api:metadata-proxy] Failed to process JSON data', { error });
        throw statusError(500, 'Failed to process JSON data', { cause: error });
    }
}

/**
 * Process text response as JSON, handling newlines and whitespace issues
 */
export async function processTextAsJson(data: Response) {
    const headers = data.headers;

    try {
        const text = await data.text();
        // Remove trailing/leading whitespace and normalize line endings
        // eslint-disable-next-line no-restricted-syntax -- normalize CRLF to LF line endings
        const cleanedText = text.trim().replace(/\r\n/g, '\n');
        const json = JSON.parse(cleanedText);

        return { data: json, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw statusError(413, 'Text body exceeds max size', { cause: error });
        } else if (error instanceof SyntaxError) {
            throw statusError(415, 'Malformed JSON in text upstream response', { cause: error });
        }
        Logger.debug('[api:metadata-proxy] Failed to process text-as-JSON data', { error });
        throw statusError(500, 'Failed to process text-as-JSON data', { cause: error });
    }
}
