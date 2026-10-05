import { parseRpcEndpoint } from '@entities/cluster';
import { describe, expect, it } from 'vitest';

import { endpointName } from '../endpoint-name';

function endpoint(url: string) {
    const parsed = parseRpcEndpoint(url);
    if (!parsed) throw new Error(`test fixture is not an RPC endpoint: ${url}`);
    return parsed;
}

describe('endpointName', () => {
    // The navbar label is always visible, often on a shared screen, so a key in the path or query must
    // never reach it.
    it('should trim a remote URL to scheme and host, dropping an embedded key', () => {
        expect(endpointName(endpoint('https://rpc.example.com/path?api-key=secret'))).toBe('https://rpc.example.com');
    });

    it('should keep the port of a remote host', () => {
        expect(endpointName(endpoint('https://rpc.example.com:8899'))).toBe('https://rpc.example.com:8899');
    });

    // A local endpoint reaches nothing its sender can read back, and its full href helps the operator tell
    // two local nodes apart.
    it('should show the full href for a local endpoint', () => {
        expect(endpointName(endpoint('http://localhost:8899/path'))).toBe('http://localhost:8899/path');
    });
});
