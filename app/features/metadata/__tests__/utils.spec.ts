import { vi } from 'vitest';

import { getProxiedUri } from '../utils';

// A well-known valid CIDv0 (contains Hello World)
const VALID_CID_V0 = 'QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u';
// A well-known valid CIDv1 (contains Hello World)
const VALID_CID_V1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ek5bfx73d7h4x7bgd35y2nuq';

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

    it('returns the rewritten HTTP gateway URI when proxy is not enabled and protocol is ipfs (CIDv0)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'false';
        const uri = `ipfs://${VALID_CID_V0}`;
        expect(getProxiedUri(uri)).toBe(`https://ipfs.io/ipfs/${VALID_CID_V0}`);
    });

    it('returns the rewritten HTTP gateway URI when proxy is not enabled and protocol is ipfs (CIDv1)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'false';
        const uri = `ipfs://${VALID_CID_V1}`;
        expect(getProxiedUri(uri)).toBe(`https://ipfs.io/ipfs/${VALID_CID_V1}`);
    });

    it('returns proxied HTTP gateway URI when proxy is enabled and protocol is ipfs (CIDv0)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = `ipfs://${VALID_CID_V0}`;
        expect(getProxiedUri(uri)).toBe(`/api/metadata/proxy?uri=${encodeURIComponent(`https://ipfs.io/ipfs/${VALID_CID_V0}`)}`);
    });

    it('returns proxied HTTP gateway URI when proxy is enabled and protocol is ipfs (CIDv1)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = `ipfs://${VALID_CID_V1}`;
        expect(getProxiedUri(uri)).toBe(`/api/metadata/proxy?uri=${encodeURIComponent(`https://ipfs.io/ipfs/${VALID_CID_V1}`)}`);
    });

    it('returns proxied HTTP gateway URI handling ipfs/ prefix when proxy is enabled and protocol is ipfs (CIDv0)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = `ipfs://ipfs/${VALID_CID_V0}`;
        expect(getProxiedUri(uri)).toBe(`/api/metadata/proxy?uri=${encodeURIComponent(`https://ipfs.io/ipfs/${VALID_CID_V0}`)}`);
    });

    it('returns proxied HTTP gateway URI handling ipfs/ prefix when proxy is enabled and protocol is ipfs (CIDv1)', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        const uri = `ipfs://ipfs/${VALID_CID_V1}`;
        expect(getProxiedUri(uri)).toBe(`/api/metadata/proxy?uri=${encodeURIComponent(`https://ipfs.io/ipfs/${VALID_CID_V1}`)}`);
    });

    it('returns empty string for malformed IPFS CIDs', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        expect(getProxiedUri('ipfs://not-a-valid-cid')).toBe('');
    });

    it('returns empty string when empty string is passed', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        expect(getProxiedUri('')).toBe('');
    });

    it('throws an error for invalid URL strings', () => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
        expect(() => getProxiedUri('not-a-valid-url')).toThrow();
        expect(() => getProxiedUri('://missing-protocol')).toThrow();
        expect(() => getProxiedUri('http://')).toThrow();
    });
});
