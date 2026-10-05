import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSnsDomains } from '../fetch-sns-domains';

const USER_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOLY_NAME_ACCOUNT = 'FX1APjKbFu6M8GKb3dGXcZLXjxX4fGaYwvHqb5Vaee8q';
const BONFIDA_NAME_ACCOUNT = 'Crf8hzfthWGbGbLTVCiqRqV5MVnbpHB1L9KQMd6gsinb';

const mockFetchFn = vi.fn();
vi.stubGlobal('fetch', mockFetchFn);

describe('fetchSnsDomains', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([
        [
            'valid response',
            { [USER_ADDRESS]: ['toly', 'bonfida'] },
            [
                { address: TOLY_NAME_ACCOUNT, name: 'toly.sns' },
                { address: BONFIDA_NAME_ACCOUNT, name: 'bonfida.sns' },
            ],
        ],
        [
            'non-conforming values for other keys',
            { [USER_ADDRESS]: ['toly'], stats: 'not-an-array' },
            [{ address: TOLY_NAME_ACCOUNT, name: 'toly.sns' }],
        ],
    ])('should return domains from %s', async (_label, body, expected) => {
        mockFetch(body);

        expect(await fetchSnsDomains(USER_ADDRESS)).toEqual(expected);
    });

    it('should throw when Bonfida API returns non-200', async () => {
        mockFetch(null, { ok: false, status: 500 });

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Failed to fetch domains from Bonfida API');
    });

    it.each([
        ['response is not an object', 'not-json-object'],
        ['response is null', null],
        ['address key has non-string array values', { [USER_ADDRESS]: [42, null] }],
        ['address value is not an array', { [USER_ADDRESS]: 'not-an-array' }],
        ['array contains mix of strings and non-strings', { [USER_ADDRESS]: ['alice', 42, 'bob'] }],
    ])('should throw when %s', async (_label, body) => {
        mockFetch(body);

        await expect(fetchSnsDomains(USER_ADDRESS)).rejects.toThrow('Unexpected Bonfida API response format');
    });

    it.each([
        ['address key is missing', {}],
        ['another address has domains', { someOtherAddress: ['alice'] }],
        ['address key maps to empty array', { [USER_ADDRESS]: [] }],
    ])('should return empty array when %s', async (_label, body) => {
        mockFetch(body);

        const result = await fetchSnsDomains(USER_ADDRESS);
        expect(result).toEqual([]);
    });

    it('should return undefined when Bonfida API returns 404', async () => {
        mockFetch(null, { ok: false, status: 404 });

        const result = await fetchSnsDomains(USER_ADDRESS);
        expect(result).toBeUndefined();
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
