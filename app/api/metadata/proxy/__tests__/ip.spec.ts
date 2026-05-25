import _dns, { type LookupAddress } from 'dns';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { lookupHostnameSafely } from '../feature/ip';

const dns = _dns.promises;

vi.mock('dns', async () => {
    const originalDns = await vi.importActual('dns');
    const lookupFn = vi.fn();
    return {
        ...originalDns,
        default: {
            promises: {
                lookup: lookupFn,
            },
        },
        promises: {
            lookup: lookupFn,
        },
    };
});

function mockLookupOnce(addresses: LookupAddress | LookupAddress[] | undefined) {
    // @ts-expect-error lookup does not have mockImplementation
    dns.lookup.mockResolvedValueOnce(addresses);
}

describe('lookupHostnameSafely', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should return public + pinned lookup for a valid public IPv4', async () => {
        mockLookupOnce([{ address: '8.8.8.8', family: 4 }]);

        const result = await lookupHostnameSafely('google.com');

        expect(result.kind).toBe('public');
        if (result.kind === 'public') {
            expect(result.addresses).toEqual([{ address: '8.8.8.8', family: 4 }]);
            expect(typeof result.lookup).toBe('function');
        }
    });

    test('should return public for a valid public IPv6', async () => {
        mockLookupOnce([{ address: '2606:4700:4700::1111', family: 6 }]);

        const result = await lookupHostnameSafely('one.one.one.one');

        expect(result.kind).toBe('public');
    });

    test('should block private IPv4', async () => {
        mockLookupOnce([{ address: '192.168.1.1', family: 4 }]);

        const result = await lookupHostnameSafely('intranet.local');

        expect(result).toMatchObject({ kind: 'private' });
    });

    test('should block the AWS metadata IP', async () => {
        mockLookupOnce([{ address: '169.254.169.254', family: 4 }]);

        const result = await lookupHostnameSafely('attacker.com');

        expect(result).toMatchObject({ kind: 'private' });
    });

    test('should block if ANY resolved address is private (mixed result)', async () => {
        // A malicious resolver could return a public + a private address to
        // try to slip past — every address must be public.
        mockLookupOnce([
            { address: '8.8.8.8', family: 4 },
            { address: '127.0.0.1', family: 4 },
        ]);

        const result = await lookupHostnameSafely('attacker.com');

        expect(result).toMatchObject({ kind: 'private' });
    });

    test('should block localhost without doing DNS at all', async () => {
        const result = await lookupHostnameSafely('localhost');

        expect(result).toMatchObject({ kind: 'private' });
        expect(dns.lookup).not.toHaveBeenCalled();
    });

    test('should treat DNS resolution failure as private', async () => {
        // @ts-expect-error lookup does not have mockImplementation
        dns.lookup.mockRejectedValueOnce(new Error('DNS resolution failed'));

        const result = await lookupHostnameSafely('unknown.domain');

        expect(result).toMatchObject({ kind: 'private', reason: 'DNS resolution failed' });
    });

    test('should treat empty address list as private', async () => {
        mockLookupOnce([]);

        const result = await lookupHostnameSafely('vanishes.local');

        expect(result).toMatchObject({ kind: 'private', reason: 'no addresses' });
    });

    test('should treat undefined dns result as private', async () => {
        mockLookupOnce(undefined);

        const result = await lookupHostnameSafely('vanishes.local');

        expect(result).toMatchObject({ kind: 'private' });
    });
});

// The pinned lookup is the core of the DNS-rebinding fix: it must replay the
// pre-validated addresses no matter what the kernel would have resolved.
describe('lookupHostnameSafely — pinned lookup behaviour', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('pinned lookup should return the validated address regardless of the hostname argument', async () => {
        mockLookupOnce([{ address: '8.8.8.8', family: 4 }]);

        const result = await lookupHostnameSafely('google.com');
        if (result.kind !== 'public') throw new Error('expected public');

        // Call the pinned lookup with a totally different hostname — it must
        // ignore the argument and return what we already validated.
        await new Promise<void>((resolve, reject) => {
            result.lookup('attacker.evil', {}, (err, address, family) => {
                if (err) return reject(err);
                if (Array.isArray(address)) return reject(new Error('expected single address'));
                expect(address).toBe('8.8.8.8');
                expect(family).toBe(4);
                resolve();
            });
        });
    });

    test('pinned lookup should respect the requested family filter', async () => {
        mockLookupOnce([
            { address: '8.8.8.8', family: 4 },
            { address: '2001:4860:4860::8888', family: 6 },
        ]);

        const result = await lookupHostnameSafely('google.com');
        if (result.kind !== 'public') throw new Error('expected public');

        await new Promise<void>((resolve, reject) => {
            result.lookup('google.com', { family: 6 }, (err, address, family) => {
                if (err) return reject(err);
                if (Array.isArray(address)) return reject(new Error('expected single address'));
                expect(address).toBe('2001:4860:4860::8888');
                expect(family).toBe(6);
                resolve();
            });
        });
    });

    // undici 6.x's `Agent` calls the lookup with `{ all: true }`, expecting
    // an array callback. If we only supported the single-result form, real
    // connections would fail with "Invalid IP address: undefined".
    test('pinned lookup should return the full array when called with { all: true }', async () => {
        mockLookupOnce([
            { address: '8.8.8.8', family: 4 },
            { address: '2001:4860:4860::8888', family: 6 },
        ]);

        const result = await lookupHostnameSafely('google.com');
        if (result.kind !== 'public') throw new Error('expected public');

        await new Promise<void>((resolve, reject) => {
            result.lookup('google.com', { all: true }, (err, addresses) => {
                if (err) return reject(err);
                if (!Array.isArray(addresses)) return reject(new Error('expected array'));
                expect(addresses).toEqual([
                    { address: '8.8.8.8', family: 4 },
                    { address: '2001:4860:4860::8888', family: 6 },
                ]);
                resolve();
            });
        });
    });
});
