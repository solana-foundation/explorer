import { vi } from 'vitest';

import { getProxiedUri } from '../utils';

// A well-known valid CIDv0 (contains Hello World)
const VALID_CID_V0 = 'QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u';
// A well-known valid CIDv1 (contains Hello World)
const VALID_CID_V1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3ek5bfx73d7h4x7bgd35y2nuq';

const proxied = (uri: string) => `/api/metadata/proxy?uri=${encodeURIComponent(uri)}`;

describe('getProxiedUri', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.each([
        ['return the original URI when proxy is not enabled', 'false', 'http://example.com', 'http://example.com'],
        ['return the original URI for non-http/https protocols', 'true', 'ftp://example.com', 'ftp://example.com'],
        [
            'return proxied URI when proxy is enabled and protocol is http',
            'true',
            'http://example.com',
            '/api/metadata/proxy?uri=http%3A%2F%2Fexample.com',
        ],
        [
            'return proxied URI when proxy is enabled and protocol is https',
            'true',
            'https://example.com',
            '/api/metadata/proxy?uri=https%3A%2F%2Fexample.com',
        ],
        [
            'return the rewritten HTTP gateway URI when proxy is not enabled and protocol is ipfs (CIDv0)',
            'false',
            `ipfs://${VALID_CID_V0}`,
            `https://ipfs.io/ipfs/${VALID_CID_V0}`,
        ],
        [
            'return the rewritten HTTP gateway URI when proxy is not enabled and protocol is ipfs (CIDv1)',
            'false',
            `ipfs://${VALID_CID_V1}`,
            `https://ipfs.io/ipfs/${VALID_CID_V1}`,
        ],
        [
            'return proxied HTTP gateway URI when proxy is enabled and protocol is ipfs (CIDv0)',
            'true',
            `ipfs://${VALID_CID_V0}`,
            proxied(`https://ipfs.io/ipfs/${VALID_CID_V0}`),
        ],
        [
            'return proxied HTTP gateway URI when proxy is enabled and protocol is ipfs (CIDv1)',
            'true',
            `ipfs://${VALID_CID_V1}`,
            proxied(`https://ipfs.io/ipfs/${VALID_CID_V1}`),
        ],
        [
            'return proxied HTTP gateway URI handling ipfs/ prefix when proxy is enabled and protocol is ipfs (CIDv0)',
            'true',
            `ipfs://ipfs/${VALID_CID_V0}`,
            proxied(`https://ipfs.io/ipfs/${VALID_CID_V0}`),
        ],
        [
            'return proxied HTTP gateway URI handling ipfs/ prefix when proxy is enabled and protocol is ipfs (CIDv1)',
            'true',
            `ipfs://ipfs/${VALID_CID_V1}`,
            proxied(`https://ipfs.io/ipfs/${VALID_CID_V1}`),
        ],
        [
            'resolve ipfs:// URI with subpath when proxy is disabled',
            'false',
            `ipfs://${VALID_CID_V0}/image.png`,
            `https://ipfs.io/ipfs/${VALID_CID_V0}/image.png`,
        ],
        [
            'resolve ipfs:// URI with nested subpath when proxy is enabled',
            'true',
            `ipfs://${VALID_CID_V1}/metadata/0.json`,
            proxied(`https://ipfs.io/ipfs/${VALID_CID_V1}/metadata/0.json`),
        ],
        ['return empty string for malformed IPFS CIDs', 'true', 'ipfs://not-a-valid-cid', ''],
        ['return empty string when empty string is passed', 'true', '', ''],
        // Unparseable on-chain URIs must not crash callers that render the
        // result inline (e.g. ProxiedImage outside an error boundary).
        ['return a malformed URL unchanged rather than throw', 'true', 'not-a-valid-url', 'not-a-valid-url'],
        ['return a URL without a protocol unchanged', 'true', '://missing-protocol', '://missing-protocol'],
        ['return a URL without a host unchanged', 'true', 'http://', 'http://'],
    ])('should %s', (_, metadataEnabled, uri, expected) => {
        vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', metadataEnabled);

        expect(getProxiedUri(uri)).toBe(expected);
    });
});
