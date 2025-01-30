/**
 * @jest-environment node
 */
import _dns from 'dns';

import { checkURLForPrivateIP } from '../feature/ip';

const dns = _dns.promises;

jest.mock('dns', () => {
    const originalDns = jest.requireActual('dns');
    const lookupFn = jest.fn();
    return {
        ...originalDns,
        promises: {
            ...originalDns.promises,
            lookup: lookupFn,
        }
    };
});

/**
 *  mock valid response
 */
function mockLookupOnce(addresses: { address: string }[]) {
    // @ts-expect-error lookup does not have mocked fn
    dns.lookup.mockResolvedValueOnce(addresses);
}

describe('ip::checkURLForPrivateIP', () => {
    afterEach(() => {
        jest.clearAllMocks();
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

    test('should block localhost', async () => {
        mockLookupOnce([{ address: '127.0.0.1' }]);
        await expect(checkURLForPrivateIP('http://localhost')).resolves.toBe(true);
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

    test('should handle DNS resolution failure gracefully', async () => {
        // @ts-expect-error fetch does not have mocked fn
        dns.lookup.mockRejectedValueOnce(new Error('DNS resolution failed'));
        await expect(checkURLForPrivateIP('http://unknown.domain')).resolves.toBe(true);
    });
});
