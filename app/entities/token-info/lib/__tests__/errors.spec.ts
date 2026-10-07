import { describe, expect, it } from 'vitest';

import { isTransientError, TokenInfoHttpError, TokenInfoInvalidResponseError } from '../errors';

describe('isTransientError', () => {
    it.each([429, 500, 502, 503, 504])('should be true for HTTP %i', status => {
        expect(isTransientError(new TokenInfoHttpError({ status, statusText: 'x' }))).toBe(true);
    });

    it.each([400, 401, 403, 404, 422])('should be false for HTTP %i', status => {
        expect(isTransientError(new TokenInfoHttpError({ status, statusText: 'x' }))).toBe(false);
    });

    it('should be true for an expired abort signal', async () => {
        const error = await rejection(fetchWithSignal(AbortSignal.timeout(1)));

        expect(isTransientError(error)).toBe(true);
    });

    it('should be true for an aborted request', async () => {
        const error = await rejection(fetchWithSignal(AbortSignal.abort()));

        expect(error).toHaveProperty('name', 'AbortError');
        expect(isTransientError(error)).toBe(true);
    });

    it('should be true for a connection that nothing listens on', async () => {
        const error = await rejection(fetch(`http://127.0.0.1:${await unusedPort()}`));

        expect(errorCode(error)).toBe('ECONNREFUSED');
        expect(isTransientError(error)).toBe(true);
    });

    it('should be true for a response that drops after the headers', async () => {
        const error = await rejection(readBodyOfDroppedResponse());

        expect(errorCode(error)).toBe('UND_ERR_SOCKET');
        expect(isTransientError(error)).toBe(true);
    });

    it('should be false for an invalid response', () => {
        expect(isTransientError(new TokenInfoInvalidResponseError())).toBe(false);
    });

    it('should be false for a body that is not JSON', async () => {
        const error = await rejection(new Response('<html>').json());

        expect(error).toBeInstanceOf(SyntaxError);
        expect(isTransientError(error)).toBe(false);
    });

    it('should be false for a TypeError from our own code', () => {
        expect(isTransientError(new TypeError("Cannot read properties of undefined (reading 'content')"))).toBe(false);
    });

    it.each([undefined, null, 'fetch failed', { name: 'TimeoutError' }])('should be false for %j', value => {
        expect(isTransientError(value)).toBe(false);
    });
});

async function unusedPort(): Promise<number> {
    const { createServer } = await import('node:http');
    const server = createServer();
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    await new Promise(resolve => server.close(resolve));
    return port;
}

// The server promises a body, sends the headers, then closes the socket.
async function readBodyOfDroppedResponse() {
    const { createServer } = await import('node:http');
    const server = createServer((_request, response) => {
        response.writeHead(200, { 'content-length': '100' });
        response.flushHeaders();
        setTimeout(() => response.destroy(), 10);
    });
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    try {
        const response = await fetch(`http://127.0.0.1:${port}`);
        return await response.json();
    } finally {
        server.closeAllConnections();
        server.close();
    }
}

function errorCode(error: unknown): unknown {
    for (let current = error; current instanceof Error; current = current.cause) {
        const code = (current as { code?: unknown }).code;
        if (code) return code;
    }
}

// A request to a server that holds the connection open, so only the signal can end it.
async function fetchWithSignal(signal: AbortSignal) {
    const { createServer } = await import('node:http');
    const server = createServer(() => {});
    await new Promise<void>(resolve => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    try {
        return await fetch(`http://127.0.0.1:${port}`, { signal });
    } finally {
        server.closeAllConnections();
        server.close();
    }
}

async function rejection(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
    } catch (error) {
        return error;
    }
    throw new Error('expected the promise to reject');
}
