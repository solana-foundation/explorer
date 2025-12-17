import { default as fetch, Headers, Response as NodeFetchResponse } from 'node-fetch';

import Logger from '@/app/utils/logger';

import {
    errors,
    matchAbortError,
    matchMaxSizeError,
    matchTimeoutError,
    StatusError,
    unsupportedMediaError,
} from './errors';
import { processBinary, processJson, processTextAsJson } from './processors';

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
    size: number
): Promise<[Error, void] | [void, NodeFetchResponse]> {
    let response: NodeFetchResponse | undefined;
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
