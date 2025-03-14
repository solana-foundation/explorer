import _dns from 'dns';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { checkURLForPrivateIP } from '../feature/ip';

const dns = _dns.promises;

vi.mock('dns', async () => {
    const originalDns = await vi.importActual('dns');
    const lookupFn = vi.fn();
    return {
        ...originalDns,
        default: {
            promises: {
                lookup: lookupFn,
            }
        },
        promises: {
            lookup: lookupFn,
        }
    };
});

/**
 *  mock valid response
 */

type LookupAddress = { address: string };

function mockLookupOnce(addresses: LookupAddress | LookupAddress[] | undefined) {
    // @ts-expect-error lookup does not have mockImplementation
    dns.lookup.mockResolvedValueOnce(addresses);
}

describe('ip::checkURLForPrivateIP', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // do not throw exceptions forinvalid input to not break the execution flow
    test('should handle invalid URL gracefully', async () => {
        await expect(checkURLForPrivateIP('not-a-valid-url')).resolves.toBe(true);
    });

    test('should block unsupported protocols', async () => {
        await expect(checkURLForPrivateIP('ftp://example.com')).resolves.toBe(true);
    });

    test('should allow valid public URL', async () => {
        mockLookupOnce([{ address: '8.8.8.8' }]);
        expect(await checkURLForPrivateIP('http://google.com')).toBe(false);
    });

    test('should allow valid public IPv6', async () => {
        mockLookupOnce([{ address: '2606:4700:4700::1111' }]);
        await expect(checkURLForPrivateIP('https://[2606:4700:4700::1111]')).resolves.toBe(false);
    });

    test('should block private IPv4', async () => {
        mockLookupOnce([{ address: '192.168.1.1' }]);
        await expect(checkURLForPrivateIP('http://192.168.1.1')).resolves.toBe(true);
    });

    test('should block decimal-encoded private IP', async () => {
        mockLookupOnce([{ address: '192.168.1.1' }]);
        await expect(checkURLForPrivateIP('http://3232235777')).resolves.toBe(true);
    });

    test('should block hex-encoded private IP', async () => {
        mockLookupOnce([{ address: '192.168.1.1' }]);
        await expect(checkURLForPrivateIP('http://0xC0A80101')).resolves.toBe(true);
    });

    test('should block cloud metadata IP', async () => {
        mockLookupOnce([{ address: '169.254.169.254' }]);
        await expect(checkURLForPrivateIP('http://169.254.169.254')).resolves.toBe(true);
    });

    test('should handle absent address negatively', async () => {
        mockLookupOnce(undefined);
        await expect(checkURLForPrivateIP('http://hello.world')).resolves.toBe(true);
    });

    test('should handle DNS resolution failure gracefully', async () => {
        // @ts-expect-error lookup does not have mockImplementation
        dns.lookup.mockRejectedValueOnce(new Error('DNS resolution failed'));
        await expect(checkURLForPrivateIP('http://unknown.domain')).resolves.toBe(true);
    });
});

describe('ip::checkURLForPrivateIP with single resolved address', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should handle single address positively', async () => {
        mockLookupOnce({ address: '76.76.21.21' });
        await expect(checkURLForPrivateIP('http://solana.com')).resolves.toBe(false);
    });
});

// move case for localhost to a separate test case as it's a special case and doesn't require DNS resolution
describe('ip::checkURLForPrivateIP with localhost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should block localhost', async () => {
        await expect(checkURLForPrivateIP('http://localhost')).resolves.toBe(true);
    });
});
