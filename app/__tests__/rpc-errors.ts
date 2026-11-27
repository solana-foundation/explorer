import { SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, SolanaError } from '@solana/kit';
import { expect } from 'vitest';

export function httpError(statusCode: number) {
    return new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
        headers: new Headers(),
        message: `HTTP ${statusCode}`,
        statusCode,
    });
}

export function connectionFailure(code: string) {
    const cause = Object.assign(new Error(`${code} on connect`), { code });
    return Object.assign(new TypeError('fetch failed'), { cause });
}

export function reported(extras: Record<string, unknown>) {
    return expect.objectContaining({ sentry: true, sentryExtras: expect.objectContaining(extras) });
}
