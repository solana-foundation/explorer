import { Response as NodeFetchResponse } from 'node-fetch';

import Logger from '@/app/utils/logger';

import { errors, matchMaxSizeError } from './errors';

/**
 * process binary data and catch any specific errors
 */
export async function processBinary(data: NodeFetchResponse) {
    const headers = data.headers;

    try {
        // request binary data to check for max-size excess
        const buffer = await data.arrayBuffer();

        return { data: buffer, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw errors[413];
        } else {
            Logger.debug('Debug:', error);
            throw errors[500];
        }
    }
}

/**
 * process text data as json and handle specific errors
 */
export async function processJson(data: NodeFetchResponse) {
    const headers = data.headers;

    try {
        const json = await data.json();

        return { data: json, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw errors[413];
        } else if (error instanceof SyntaxError) {
            // Handle JSON syntax errors specifically
            throw errors[415];
        } else {
            Logger.debug('Debug:', error);
            throw errors[500];
        }
    }
}

/**
 * Process text response as JSON, handling newlines and whitespace issues
 */
export async function processTextAsJson(data: NodeFetchResponse) {
    const headers = data.headers;

    try {
        const text = await data.text();
        // Remove trailing/leading whitespace and normalize line endings
        const cleanedText = text.trim().replace(/\r\n/g, '\n');
        const json = JSON.parse(cleanedText);

        return { data: json, headers };
    } catch (error) {
        if (matchMaxSizeError(error)) {
            throw errors[413];
        } else if (error instanceof SyntaxError) {
            throw errors[415];
        } else {
            Logger.debug('Debug:', error);
            throw errors[500];
        }
    }
}
