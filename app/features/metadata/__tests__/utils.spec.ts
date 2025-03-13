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

    it('returns the original URI when proxy is not enabled', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'false';
        const uri = 'http://example.com';
        expect(getProxiedUri(uri)).toBe(uri);
    });

    it('returns the original URI for non-http/https protocols', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'ftp://example.com';
        expect(getProxiedUri(uri)).toBe(uri);
    });

    it('returns proxied URI when proxy is enabled and protocol is http', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'http://example.com';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=http%3A%2F%2Fexample.com');
    });

    it('returns proxied URI when proxy is enabled and protocol is https', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = 'https://example.com';
        expect(getProxiedUri(uri)).toBe('/api/metadata/proxy?uri=https%3A%2F%2Fexample.com');
    });
});
