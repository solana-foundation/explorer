import { Account, FetchersContext, StateContext } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { NATIVE_MINT } from '@solana/spl-token';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { useAccountExpandedInfo } from '../use-account-expanded-info';

const TEST_ADDRESS = NATIVE_MINT.toBase58();

function makeAccount(pubkey: string): Account {
    return {
        data: {},
        executable: false,
        lamports: 1_000_000,
        owner: SystemProgram.programId,
        pubkey: new PublicKey(pubkey),
    };
}

function createWrapper(entries: Record<string, { status: FetchStatus; data?: Account }> = {}) {
    const parsedFetch = vi.fn();
    const state = { entries, url: MAINNET_BETA_URL };
    const fetchers = {
        parsed: { fetch: parsedFetch },
        raw: { fetch: vi.fn() },
        skip: { fetch: vi.fn() },
    };
    return {
        parsedFetch,
        wrapper: ({ children }: { children: React.ReactNode }) =>
            React.createElement(
                StateContext.Provider,
                { value: state },
                React.createElement(FetchersContext.Provider, { value: fetchers as any }, children),
            ),
    };
}

describe('useAccountExpandedInfo', () => {
    it('should return disabled state when enabled is false', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, false), { wrapper });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
    });

    it('should not trigger a fetch when enabled is false', () => {
        const { wrapper, parsedFetch } = createWrapper();
        renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, false), { wrapper });

        expect(parsedFetch).not.toHaveBeenCalled();
    });

    it('should trigger a parsed fetch when enabled and no cache entry exists', () => {
        const { wrapper, parsedFetch } = createWrapper();
        renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(parsedFetch).toHaveBeenCalledOnce();
        expect(parsedFetch.mock.calls[0][0].toBase58()).toBe(TEST_ADDRESS);
    });

    it('should return isLoading true when enabled and no cache entry exists', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('should return the full Account object when cache entry is fetched', () => {
        const account = makeAccount(TEST_ADDRESS);
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { data: account, status: FetchStatus.Fetched },
        });
        const { result } = renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(result.current.data).toBe(account);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
    });

    it('should return isLoading true when cache entry is in Fetching status', () => {
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { status: FetchStatus.Fetching },
        });
        const { result } = renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('should return isError true when fetch failed', () => {
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { status: FetchStatus.FetchFailed },
        });
        const { result } = renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(result.current.isError).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeUndefined();
    });

    it('should not re-fetch when cache entry already exists', () => {
        const account = makeAccount(TEST_ADDRESS);
        const { wrapper, parsedFetch } = createWrapper({
            [TEST_ADDRESS]: { data: account, status: FetchStatus.Fetched },
        });
        renderHook(() => useAccountExpandedInfo(TEST_ADDRESS, true), { wrapper });

        expect(parsedFetch).not.toHaveBeenCalled();
    });
});
