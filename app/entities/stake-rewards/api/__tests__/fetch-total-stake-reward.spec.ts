import { gen } from '@__fixtures__/gen';
import { address } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SolscanRequestError, SolscanResponseError } from '../../lib/errors';
import { fetchTotalStakeReward } from '../fetch-total-stake-reward';

const ADDRESS = address(gen.address(0));
const API_KEY = 'test-key';
const PAGE_SIZE = 100;

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('fetchTotalStakeReward', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should sum a single short page', async () => {
        mockPages([[reward(1_000), reward(2_500), reward(0)]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).resolves.toEqual({
            epochs: 3,
            lamports: 3_500,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should page until a short page arrives and sum across pages', async () => {
        mockPages([fullPage(10), fullPage(20), [reward(7)]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).resolves.toEqual({
            epochs: 2 * PAGE_SIZE + 1,
            lamports: 10 * PAGE_SIZE + 20 * PAGE_SIZE + 7,
        });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should query the stake-account reward endpoint, not the wallet stake listing', async () => {
        mockPages([[]]);

        await fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY });

        const url = new URL(fetchMock.mock.calls[0][0]);
        // `account/stake` takes a wallet; only this path documents a stake account address.
        expect(url.pathname).toBe('/v2.0/account/stake/reward');
        expect(url.searchParams.get('address')).toBe(ADDRESS);
    });

    it('should treat an empty first page as a zero total rather than an error', async () => {
        mockPages([[]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).resolves.toEqual({
            epochs: 0,
            lamports: 0,
        });
    });

    it('should request the full history, not Solscan’s one-month default window', async () => {
        mockPages([[]]);

        await fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY });

        const url = new URL(fetchMock.mock.calls[0][0]);
        // Mainnet-beta genesis: no reward can predate the cluster.
        expect(url.searchParams.get('from_time')).toBe('1584316800');
        expect(url.searchParams.get('page_size')).toBe(String(PAGE_SIZE));
    });

    it('should send the key in the token header', async () => {
        mockPages([[]]);

        await fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY });

        expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { token: API_KEY } });
    });

    it('should throw SolscanRequestError carrying the upstream status', async () => {
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 429 });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toMatchObject({
            name: 'SolscanRequestError',
            status: 429,
        });
    });

    it('should fail rather than return a partial total when a later page fails', async () => {
        mockPages([fullPage(10)]);
        fetchMock.mockResolvedValueOnce({ json: async () => ({}), ok: false, status: 500 });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanRequestError,
        );
    });

    it('should reject a reward that is not denominated in lamports', async () => {
        mockPages([[{ amount: 5, decimals: 2, epoch: 900 }]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanResponseError,
        );
    });

    it('should reject a total that exceeds safe integer range', async () => {
        // Two rows that are individually exact but whose sum is not representable.
        const half = Number.MAX_SAFE_INTEGER - 1;
        mockPages([[reward(half), reward(half)]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toThrow(
            'exceeds safe integer range',
        );
    });

    it('should reject a negative amount, which would break the monotonic sum', async () => {
        mockPages([[{ amount: -1, decimals: 9, epoch: 900 }]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toThrow();
    });

    it('should reject a fractional amount', async () => {
        mockPages([[{ amount: 1.5, decimals: 9, epoch: 900 }]]);

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toThrow();
    });

    it('should reject a response whose shape does not validate', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ data: [{ amount: 'not-a-number', decimals: 9, epoch: 900 }], success: true }),
            ok: true,
            status: 200,
        });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanResponseError,
        );
    });

    it('should reject a 200 that reports success: false rather than read it as a short page', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ errors: { code: 1001, message: 'Invalid address' }, success: false }),
            ok: true,
            status: 200,
        });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanResponseError,
        );
    });

    it('should carry the reason Solscan gave for an unsuccessful response', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ errors: { code: 1001, message: 'Invalid address' }, success: false }),
            ok: true,
            status: 200,
        });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toThrow('Invalid address');
    });

    it('should stop paging rather than sum rows from an unsuccessful later page', async () => {
        mockPages([fullPage(10)]);
        fetchMock.mockResolvedValueOnce({ json: async () => ({ success: false }), ok: true, status: 200 });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanResponseError,
        );
    });

    it('should reject a success that carries no data at all', async () => {
        fetchMock.mockResolvedValueOnce({ json: async () => ({ success: true }), ok: true, status: 200 });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toBeInstanceOf(
            SolscanResponseError,
        );
    });

    it('should preserve the underlying validation failure as the cause', async () => {
        fetchMock.mockResolvedValueOnce({
            json: async () => ({ data: [{ amount: 'not-a-number', decimals: 9, epoch: 900 }], success: true }),
            ok: true,
            status: 200,
        });

        const error = await fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY }).catch(e => e);

        expect(error.cause).toBeInstanceOf(Error);
    });

    it('should raise our own invariant failures as plain errors, not vendor-contract ones', async () => {
        fetchMock.mockResolvedValue({
            json: async () => ({ data: fullPage(1), success: true }),
            ok: true,
            status: 200,
        });

        const error = await fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY }).catch(e => e);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(SolscanResponseError);
    });

    it('should stop paging at the cap instead of looping forever', async () => {
        fetchMock.mockResolvedValue({
            json: async () => ({ data: fullPage(1), success: true }),
            ok: true,
            status: 200,
        });

        await expect(fetchTotalStakeReward({ address: ADDRESS, apiKey: API_KEY })).rejects.toThrow('exceeded 30 pages');
        expect(fetchMock).toHaveBeenCalledTimes(30);
    });
});

function reward(amount: number, epoch = 900) {
    return { amount, decimals: 9, epoch };
}

function fullPage(amount: number) {
    return Array.from({ length: PAGE_SIZE }, (_, index) => reward(amount, 900 + index));
}

function mockPages(pages: ReturnType<typeof reward>[][]) {
    for (const data of pages) {
        fetchMock.mockResolvedValueOnce({ json: async () => ({ data, success: true }), ok: true, status: 200 });
    }
}
