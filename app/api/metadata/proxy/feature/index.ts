import { Logger } from '@/app/shared/lib/logger';

import { errors, matchMaxSizeError, matchTimeoutError, StatusError, unsupportedMediaError } from './errors';
import { processBinary, processJson, processTextAsJson } from './processors';
import { readBodyWithLimit } from './read-body-with-limit';

export { StatusError };

// Content-type matchers
export const matchJson = (header?: string | null) => header?.includes('application/json');
export const matchTextPlain = (header?: string | null) => header?.includes('text/plain');
export const matchImage = (header?: string | null) => header?.includes('image/');
export const matchJsonContent = (header?: string | null) => matchJson(header) || matchTextPlain(header);

/**
 *  use this to handle errors that are thrown by fetch.
 *  it will throw size-specific ones, for example, when the resource is json
 */
function handleRequestBasedErrors(error: Error | undefined) {
    if (matchTimeoutError(error)) {
        return errors[504];
    } else if (matchMaxSizeError(error)) {
        return errors[413];
    } else if (matchAbortError(error)) {
        return errors[504];
    } else {
        return errors[500];
    }
}

async function requestResource(
    uri: string,
    headers: Headers,
    timeout: number,
    size: number,
): Promise<[Error, void] | [void, Response]> {
    try {
        const upstream = await fetch(uri, {
            headers,
            signal: AbortSignal.timeout(timeout),
        });

        // Pre-check Content-Length when present so oversize bodies fail fast.
        const contentLength = upstream.headers.get('content-length');
        if (contentLength && Number(contentLength) > size) {
            await upstream.body?.cancel();
            return [new Error(`content size over limit: ${size}`), undefined];
        }

        const buffered = await readBodyWithLimit(upstream, size);
        // Re-wrap so processors keep using `.arrayBuffer()` / `.json()` / `.text()`.
        const response = new Response(buffered, { headers: upstream.headers, status: upstream.status });
        return [undefined, response];
    } catch (e) {
        if (e instanceof Error) {
            return [e, undefined];
        }
        Logger.debug('[api:metadata-proxy] Failed to fetch resource', { error: e });
        return [new Error('Cannot fetch resource'), undefined];
    }
}

export async function fetchResource(
    uri: string,
    headers: Headers,
    timeout: number,
    size: number,
): Promise<
    Awaited<ReturnType<typeof processBinary> | ReturnType<typeof processJson> | ReturnType<typeof processTextAsJson>>
> {
    const [error, response] = await requestResource(uri, headers, timeout, size);

    // check for response to infer proper type for it
    // and throw proper error
    if (error || !response) {
        throw handleRequestBasedErrors(error ?? undefined);
    }

    // guess how to process resource by content-type
    const contentTypeHeader = response.headers.get('content-type');
    const isJson = matchJson(contentTypeHeader);
    const isPlainText = matchTextPlain(contentTypeHeader);
    const isImage = matchImage(contentTypeHeader);

    if (isJson) return processJson(response);
    if (isPlainText) return processTextAsJson(response);

    if (isImage) return processBinary(response);

    // otherwise we throw error as we getting unexpected content
    throw unsupportedMediaError;
}
