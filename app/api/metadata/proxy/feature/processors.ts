import { err, ok, type Result } from '@/app/shared/lib/result';

import { matchMaxSizeError, type StatusError, statusError } from './errors';

type Processed<T> = Result<{ data: T; headers: Headers }, StatusError>;

/**
 * Process binary data and catch any specific errors.
 */
export async function processBinary(data: Response): Promise<Processed<ArrayBuffer>> {
    const headers = data.headers;

    try {
        // request binary data to check for max-size excess
        const buffer = await data.arrayBuffer();

        return ok({ data: buffer, headers });
    } catch (error) {
        if (matchMaxSizeError(error)) {
            return err(statusError(413, 'Binary body exceeds max size', { cause: error, code: 'oversize-streamed' }));
        }
        return err(
            statusError(500, 'Failed to process binary data', {
                cause: error,
                code: 'decode-failed',
                context: { error },
            }),
        );
    }
}

/**
 * Process JSON data and handle specific errors.
 */
export async function processJson(data: Response): Promise<Processed<unknown>> {
    const headers = data.headers;

    try {
        const json = await data.json();

        return ok({ data: json, headers });
    } catch (error) {
        if (matchMaxSizeError(error)) {
            return err(statusError(413, 'JSON body exceeds max size', { cause: error, code: 'oversize-streamed' }));
        } else if (error instanceof SyntaxError) {
            return err(
                statusError(415, 'Malformed JSON in upstream response', { cause: error, code: 'malformed-json' }),
            );
        }
        return err(
            statusError(500, 'Failed to process JSON data', {
                cause: error,
                code: 'decode-failed',
                context: { error },
            }),
        );
    }
}

/**
 * Process a text response as JSON, handling newlines and whitespace issues.
 */
export async function processTextAsJson(data: Response): Promise<Processed<unknown>> {
    const headers = data.headers;

    try {
        const text = await data.text();
        // Remove trailing/leading whitespace and normalize line endings
        // eslint-disable-next-line no-restricted-syntax -- normalize CRLF to LF line endings
        const cleanedText = text.trim().replace(/\r\n/g, '\n');
        const json = JSON.parse(cleanedText);

        return ok({ data: json, headers });
    } catch (error) {
        if (matchMaxSizeError(error)) {
            return err(statusError(413, 'Text body exceeds max size', { cause: error, code: 'oversize-streamed' }));
        } else if (error instanceof SyntaxError) {
            return err(
                statusError(415, 'Malformed JSON in text upstream response', { cause: error, code: 'malformed-json' }),
            );
        }
        return err(
            statusError(500, 'Failed to process text-as-JSON data', {
                cause: error,
                code: 'decode-failed',
                context: { error },
            }),
        );
    }
}
