import { default as fetch, Headers } from "node-fetch"

export class StatusError extends Error {
    status: number;
    constructor(message: string, options: ErrorOptions & { cause: number }) {
        super(message)
        this.status = options.cause
    }
}

export async function fetchResource(uri: string, headers: Headers, timeout: number, size: number): Promise<{ data: any, headers: Headers }> {
    let responseHeaders;
    let data;

    try {
        const response = await fetch(uri, {
            headers,
            signal: AbortSignal.timeout(timeout),
            size,
        })
        responseHeaders = response?.headers;

        data = await response.json();
    } catch(e) {
        if (e instanceof Error && e.name === 'TimeoutError') {
            throw new StatusError('Request Timeout', { cause: 504 });
        } else if (e instanceof Error && e.message.match(/over limit:/)) {
            throw new StatusError('Max content size exceeded', { cause: 413 });
        } else {
            // handle any other error as general one and allow to see it at console
            // might be a good one to track with a service like Sentry
            console.error(e)
            throw new StatusError('General Error', { cause: 500 });
        }
    }

    return { data, headers: responseHeaders }
}
