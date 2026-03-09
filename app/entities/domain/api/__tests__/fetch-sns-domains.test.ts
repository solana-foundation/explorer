import { PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const mockFetchFn = vi.fn();

vi.mock('node-fetch', () => ({
    default: mockFetchFn,
}));

vi.mock('@bonfida/spl-name-service', () => ({
    getHashedName: vi.fn().mockImplementation(() => Promise.resolve(Buffer.alloc(32))),
    getNameAccountKey: vi.fn().mockImplementation(() => Promise.resolve(PublicKey.unique())),
}));

const { fetchSnsDomains } = await import('../fetch-sns-domains');

describe('fetchSnsDomains', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return domains from a valid Bonfida response', async () => {
        mockFetch({ [USER_ADDRESS]: ['alice', 'bob'] });

        const result = await fetchSnsDomains(USER_ADDRESS);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('alice.sol');
        expect(result[1].name).toBe('bob.sol');
    });

    it('should throw when Bonfida API returns non-200', async () => {
        mockFetch(null, { ok: false, status: 500 });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Failed to fetch domains from Bonfida API');
    });

    it('should throw when response is not an object', async () => {
        mockFetch('not-json-object');

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('should throw when response is null', async () => {
        mockFetch(null);

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('should throw when address key has non-string array values', async () => {
        mockFetch({ [USER_ADDRESS]: [42, null] });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('should throw when address value is not an array', async () => {
        mockFetch({ [USER_ADDRESS]: 'not-an-array' });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('should return undefined when address key is missing (empty object)', async () => {
        mockFetch({});

        const result = await fetchSnsDomains(USER_ADDRESS);
        expect(result).toBeUndefined();
    });

    it('should return undefined when another address has domains', async () => {
        mockFetch({ someOtherAddress: ['alice'] });

        const result = await fetchSnsDomains(USER_ADDRESS);
        expect(result).toBeUndefined();
    });

    it('should return empty array when address key maps to empty array', async () => {
        mockFetch({ [USER_ADDRESS]: [] });

        const result = await fetchSnsDomains(USER_ADDRESS);
        expect(result).toEqual([]);
    });

    it('should throw when array contains mix of strings and non-strings', async () => {
        mockFetch({ [USER_ADDRESS]: ['alice', 42, 'bob'] });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it('should throw when response contains non-conforming values for other keys', async () => {
        mockFetch({ [USER_ADDRESS]: ['alice'], stats: 'not-an-array' });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });
});

function mockFetch(body: unknown, opts: { ok?: boolean; status?: number } = {}) {
    const { ok = true, status = 200 } = opts;
    mockFetchFn.mockResolvedValue({
        json: () => Promise.resolve(body),
        ok,
        status,
    });
}
