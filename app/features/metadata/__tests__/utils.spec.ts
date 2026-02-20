import { vi } from 'vitest';

import { getProxiedUri } from '../utils';

describe('getProxiedUri', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return the original URI when proxy is not enabled', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'false';
        const uri = 'http://example.com';
        expect(getProxiedUri(uri)).toBe(uri);
    });

    it('should return the original URI for non-http/https protocols', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'ftp://example.com';
        expect(getProxiedUri(uri)).toBe(uri);
    });

    it('should return proxied URI when proxy is enabled and protocol is http', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'http://example.com';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=http%3A%2F%2Fexample.com');
    });

    it('should return proxied URI when proxy is enabled and protocol is https', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'https://example.com';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=https%3A%2F%2Fexample.com');
    });

    it('should return the rewritten HTTP gateway URI when proxy is not enabled and protocol is ipfs', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'false';
        const uri = 'ipfs://QmZ1A2B3C4';
        expect(getProxiedUri(uri)).toBe('https://ipfs.io/ipfs/QmZ1A2B3C4');
    });

    it('should return proxied HTTP gateway URI when proxy is enabled and protocol is ipfs', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'ipfs://QmZ1A2B3C4';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=https%3A%2F%2Fipfs.io%2Fipfs%2FQmZ1A2B3C4');
    });

    it('should return proxied HTTP gateway URI handling ipfs/ prefix when proxy is enabled and protocol is ipfs', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'ipfs://ipfs/QmZ1A2B3C4';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=https%3A%2F%2Fipfs.io%2Fipfs%2FQmZ1A2B3C4');
    });

    it('should return empty string when empty string is passed', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        expect(getProxiedUri('')).toBe('');
    });

    it('should return malformed URL strings unchanged rather than throw', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        // Unparseable on-chain URIs must not crash callers that render the
        // result inline (e.g. ProxiedImage outside an error boundary).
        expect(getProxiedUri('not-a-valid-url')).toBe('not-a-valid-url');
        expect(getProxiedUri('://missing-protocol')).toBe('://missing-protocol');
        expect(getProxiedUri('http://')).toBe('http://');
    });
});
