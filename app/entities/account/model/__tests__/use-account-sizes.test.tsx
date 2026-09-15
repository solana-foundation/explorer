import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import useSWR from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAccountSizes, useAccountSizes } from '../use-account-sizes';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_PUBKEY_1 = PublicKey.default;
const MOCK_PUBKEY_2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const mockGetMultipleAccounts = vi.fn();

vi.mock('swr', () => ({
    default: vi.fn(() => ({ data: undefined, error: undefined, isLoading: false })),
}));

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getMultipleAccounts: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetMultipleAccounts(...args) }),
            }),
        })),
    };
});

describe('useAccountSizes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useSWR).mockImplementation(
            () => ({ data: undefined, error: undefined, isLoading: false }) as ReturnType<typeof useSWR>,
        );
    });

    it('should pass null SWR key when pubkeys array is empty', () => {
        renderHook(() => useAccountSizes([], MOCK_URL));

        expect(useSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object));
    });

    it('should pass the correct SWR key for a single pubkey', () => {
        renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        expect(useSWR).toHaveBeenCalledWith(
            ['account-sizes', MOCK_PUBKEY_1.toBase58(), MOCK_URL],
            expect.any(Function),
            expect.any(Object),
        );
    });

    it('should pass the correct SWR key for multiple pubkeys', () => {
        renderHook(() => useAccountSizes([MOCK_PUBKEY_1, MOCK_PUBKEY_2], MOCK_URL));

        const expectedKey = ['account-sizes', `${MOCK_PUBKEY_1.toBase58()},${MOCK_PUBKEY_2.toBase58()}`, MOCK_URL];
        expect(useSWR).toHaveBeenCalledWith(expectedKey, expect.any(Function), expect.any(Object));
    });

    it('should return an empty Map when no data is available', () => {
        const { result } = renderHook(() => useAccountSizes([], MOCK_URL));

        expect(result.current.sizes).toBeInstanceOf(Map);
        expect(result.current.sizes.size).toBe(0);
    });

    it('should return data from SWR when available', () => {
        const mockSizes = new Map([[MOCK_PUBKEY_1.toBase58(), 3]]);
        vi.mocked(useSWR).mockReturnValue({
            data: mockSizes,
            error: undefined,
            isLoading: false,
        } as ReturnType<typeof useSWR>);

        const { result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        expect(result.current.sizes).toBe(mockSizes);
    });

    it('should return error from SWR', () => {
        const mockError = new Error('fetch failed');
        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: mockError,
            isLoading: false,
        } as ReturnType<typeof useSWR>);

        const { result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        expect(result.current.error).toBe(mockError);
    });

    it('should return loading state from SWR', () => {
        vi.mocked(useSWR).mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true,
        } as ReturnType<typeof useSWR>);

        const { result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        expect(result.current.loading).toBe(true);
    });

    it('should pass the fetcher to useSWR', () => {
        renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        const fetcherArg = vi.mocked(useSWR).mock.calls[0][1];
        expect(fetcherArg).toBeTypeOf('function');
    });

    it('should hold off focus and reconnect revalidation', () => {
        renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));

        expect(vi.mocked(useSWR).mock.calls[0][2]).toMatchObject({
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        });
    });

    it('should return the same empty map identity while the fetch is in flight', () => {
        const { result, rerender } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MOCK_URL));
        const first = result.current.sizes;
        rerender();

        expect(result.current.sizes).toBe(first);
    });
});

describe('fetchAccountSizes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should request a zero-length data slice so no account bytes are transferred', async () => {
        mockGetMultipleAccounts.mockResolvedValue([]);

        await fetchAccountSizes([MOCK_PUBKEY_1], MOCK_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [MOCK_PUBKEY_1.toBase58()],
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 } }),
        );
    });

    it('should take each size from space rather than the returned data', async () => {
        mockGetMultipleAccounts.mockResolvedValue([
            { data: ['', 'base64'], space: 3681n },
            { data: ['', 'base64'], space: 0n },
        ]);

        const sizes = await fetchAccountSizes([MOCK_PUBKEY_1, MOCK_PUBKEY_2], MOCK_URL);

        expect(sizes.get(MOCK_PUBKEY_1.toBase58())).toBe(3681);
        expect(sizes.get(MOCK_PUBKEY_2.toBase58())).toBe(0);
    });

    it('should read sizes at the same commitment as the account viewers', async () => {
        mockGetMultipleAccounts.mockResolvedValue([]);

        await fetchAccountSizes([MOCK_PUBKEY_1], MOCK_URL);

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            [MOCK_PUBKEY_1.toBase58()],
            expect.objectContaining({ commitment: 'confirmed' }),
        );
    });

    it('should omit an account whose size the node does not report', async () => {
        mockGetMultipleAccounts.mockResolvedValue([{ data: ['', 'base64'] }, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([MOCK_PUBKEY_1, MOCK_PUBKEY_2], MOCK_URL);

        expect(sizes.has(MOCK_PUBKEY_1.toBase58())).toBe(false);
        expect(sizes.get(MOCK_PUBKEY_2.toBase58())).toBe(82);
    });

    it('should omit accounts that do not exist', async () => {
        mockGetMultipleAccounts.mockResolvedValue([null, { data: ['', 'base64'], space: 82n }]);

        const sizes = await fetchAccountSizes([MOCK_PUBKEY_1, MOCK_PUBKEY_2], MOCK_URL);

        expect(sizes.has(MOCK_PUBKEY_1.toBase58())).toBe(false);
        expect(sizes.get(MOCK_PUBKEY_2.toBase58())).toBe(82);
    });
});
