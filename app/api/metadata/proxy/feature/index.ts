import { default as fetch, Headers } from 'node-fetch';

import Logger from '@/app/utils/logger';

import {
    errors,
    matchAbortError,
    matchMaxSizeError,
    matchTimeoutError,
    StatusError,
    unsupportedMediaError,
} from './errors';
import { processBinary, processJson } from './processors';

export { StatusError };

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
    size: number
): Promise<[Error, void] | [void, fetch.Response]> {
    let response: fetch.Response | undefined;
    let error;
    try {
        response = await fetch(uri, {
            headers,
            signal: AbortSignal.timeout(timeout),
            size,
        });

        return [undefined, response];
    } catch (e) {
        if (e instanceof Error) {
            error = e;
        } else {
            Logger.debug('Debug:', e);
            error = new Error('Cannot fetch resource');
        }
    }

    return [error, undefined];
}

export async function fetchResource(
    uri: string,
    headers: Headers,
    timeout: number,
    size: number
): Promise<Awaited<ReturnType<typeof processBinary> | ReturnType<typeof processJson>>> {
    const [error, response] = await requestResource(uri, headers, timeout, size);

    // check for response to infer proper type for it
    // and throw proper error
    if (error || !response) {
        throw handleRequestBasedErrors(error ?? undefined);
    }

    // guess how to process resource by content-type
    const isJson = response.headers.get('content-type')?.includes('application/json');

    const isImage = response.headers.get('content-type')?.includes('image/');

    if (isJson) return processJson(response);

    if (isImage) return processBinary(response);

    // otherwise we throw error as we getting unexpected content
    throw unsupportedMediaError;
}
