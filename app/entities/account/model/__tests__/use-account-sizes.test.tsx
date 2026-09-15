import { gen } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountSizes } from '../use-account-sizes';

const MAINNET_URL = 'https://api.mainnet-beta.solana.com';
const DEVNET_URL = 'https://api.devnet.solana.com';
const MOCK_PUBKEY_1 = PublicKey.default;
const MOCK_PUBKEY_2 = gen.publicKey(1);

const mockGetMultipleAccounts = vi.fn();

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
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));
    });

    it('should send no request for an empty list', () => {
        renderHook(() => useAccountSizes([], MAINNET_URL), { wrapper });

        expect(mockGetMultipleAccounts).not.toHaveBeenCalled();
    });

    it('should map each pubkey to the size the node reports', async () => {
        const { result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1, MOCK_PUBKEY_2], MAINNET_URL), { wrapper });

        await waitFor(() => expect(result.current.sizes.get(MOCK_PUBKEY_1.toBase58())).toBe(100));
        expect(result.current.sizes.get(MOCK_PUBKEY_2.toBase58())).toBe(101);
    });

    it('should read a new list rather than serve it the first list sizes', async () => {
        const { rerender, result } = renderHook(({ pubkeys }) => useAccountSizes(pubkeys, MAINNET_URL), {
            initialProps: { pubkeys: [MOCK_PUBKEY_1] },
            wrapper,
        });
        await waitFor(() => expect(result.current.sizes.size).toBe(1));

        rerender({ pubkeys: [MOCK_PUBKEY_2] });

        await waitFor(() => expect(result.current.sizes.get(MOCK_PUBKEY_2.toBase58())).toBe(100));
        expect(result.current.sizes.has(MOCK_PUBKEY_1.toBase58())).toBe(false);
    });

    it('should read the sizes again when the cluster changes', async () => {
        const { rerender } = renderHook(({ url }) => useAccountSizes([MOCK_PUBKEY_1], url), {
            initialProps: { url: MAINNET_URL },
            wrapper,
        });
        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1));

        rerender({ url: DEVNET_URL });

        await waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(2));
    });

    it('should surface a failed request', async () => {
        mockGetMultipleAccounts.mockRejectedValue(new Error('rpc unavailable'));

        const { result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MAINNET_URL), { wrapper });

        await waitFor(() => expect(result.current.error).toEqual(new Error('rpc unavailable')));
    });

    // A new map on every render would restart any memo keyed on it while the request is in flight.
    it('should hold one empty map until the sizes arrive', () => {
        mockGetMultipleAccounts.mockReturnValue(new Promise(() => undefined));

        const { rerender, result } = renderHook(() => useAccountSizes([MOCK_PUBKEY_1], MAINNET_URL), { wrapper });
        const first = result.current.sizes;
        rerender();

        expect(result.current.sizes).toBe(first);
        expect(first.size).toBe(0);
    });
});

// The hook requests a zero-length slice, so `space` is the only size the response carries.
function sizedAccounts(addresses: readonly string[]) {
    return addresses.map((_, index) => ({ data: ['', 'base64'], space: BigInt(100 + index) }));
}

// A fresh cache per render keeps one test's sizes out of the next one.
function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}
