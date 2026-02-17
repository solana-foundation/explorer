import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

vi.mock('@bonfida/spl-name-service', () => ({
    getHashedName: vi.fn().mockImplementation(() => Promise.resolve(Buffer.alloc(32))),
    getNameAccountKey: vi.fn().mockImplementation(() => Promise.resolve(PublicKey.unique())),
}));

const { fetchSnsDomains } = await import('../fetch-sns-domains');

describe('fetchSnsDomains', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns domains from a valid Bonfida response', async () => {
        mockFetch({ [USER_ADDRESS]: ['alice', 'bob'] });

        const result = await fetchSnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('alice.sol');
        expect(result[1].name).toBe('bob.sol');
    });

    it('throws when Bonfida API returns non-200', async () => {
        mockFetch(null, { ok: false, status: 500 });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Failed to fetch domains from Bonfida API');
    });

    it('throws when response is not an object', async () => {
        mockFetch('not-json-object');

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('throws when response is null', async () => {
        mockFetch(null);

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('throws when address key is missing', async () => {
        mockFetch({ someOtherKey: ['alice'] });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('throws when address key is not an array', async () => {
        mockFetch({ [USER_ADDRESS]: 'not-an-array' });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('filters out non-string entries in the domain list', async () => {
        mockFetch({ [USER_ADDRESS]: ['alice', 42, null, 'bob', undefined] });

        const result = await fetchSnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('alice.sol');
        expect(result[1].name).toBe('bob.sol');
    });
});

function mockFetch(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
    const { ok = true, status = 200 } = opts;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        json: () => Promise.resolve(body),
        ok,
        status,
    } as Response);
}
