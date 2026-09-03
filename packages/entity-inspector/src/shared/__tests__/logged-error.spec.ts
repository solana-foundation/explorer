import { describe, expect, it } from 'vitest';

import { toLoggedError } from '../logged-error.js';

// The endpoint an RPC failure could carry — a key-bearing url in the shape a provider hands out.
const KEY_BEARING_ENDPOINT = 'https://mainnet-beta.rpc.address/?api-key=SUPERSECRET';

describe('toLoggedError', () => {
    it('should reduce an error to its own name and message', () => {
        expect(toLoggedError(new TypeError('unexpected shape'))).toEqual({
            message: 'unexpected shape',
            name: 'TypeError',
        });
    });

    it('should carry a numeric code when the error declares one', () => {
        const error = Object.assign(new Error('idl error 4'), { code: 4 });

        expect(toLoggedError(error)).toEqual({ code: 4, message: 'idl error 4', name: 'Error' });
    });

    it('should omit a code that is not numeric', () => {
        const error = Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' });

        expect(toLoggedError(error)).toEqual({ message: 'connect failed', name: 'Error' });
    });

    it('should stringify a thrown value that is not an error', () => {
        expect(toLoggedError('plain rejection')).toEqual({ message: 'plain rejection', name: 'NonError' });
    });

    it('should drop the cause chain that names the endpoint host', () => {
        // The shape node's fetch produces for a dns failure: `fetch failed` over a cause naming the host.
        const error = new TypeError('fetch failed', {
            cause: new Error('getaddrinfo ENOTFOUND mainnet-beta.rpc.address'),
        });

        expect(toLoggedError(error)).toEqual({ message: 'fetch failed', name: 'TypeError' });
        expect(JSON.stringify(toLoggedError(error))).not.toContain('mainnet-beta.rpc.address');
    });

    it('should keep a key-bearing endpoint out of the log when the cause carries it', () => {
        const error = new Error('Upstream source is unavailable: fetch failed', {
            cause: new TypeError(`Failed to parse URL from ${KEY_BEARING_ENDPOINT}`),
        });

        expect(JSON.stringify(toLoggedError(error))).not.toContain('SUPERSECRET');
    });
});
