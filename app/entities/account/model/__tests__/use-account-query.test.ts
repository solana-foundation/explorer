import { Account, FetchersContext, StateContext } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { NATIVE_MINT } from '@solana/spl-token';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { useAccountQuery } from '../use-account-query';

const TEST_ADDRESS = NATIVE_MINT.toBase58();

function makeAccount(pubkey: string): Account {
    return {
        data: {},
        executable: false,
        lamports: 0,
        owner: SystemProgram.programId,
        pubkey: new PublicKey(pubkey),
    };
}

function createWrapper(
    entries: Record<string, { status: FetchStatus; data?: Account }> = {},
    fetchSpy = vi.fn(),
) {
    const state = { entries, url: MAINNET_BETA_URL };
    const fetchers = {
        parsed: { fetch: fetchSpy },
        raw: { fetch: vi.fn() },
        skip: { fetch: vi.fn() },
    };
    return {
        fetchSpy,
        wrapper: ({ children }: { children: React.ReactNode }) =>
            React.createElement(
                StateContext.Provider,
                { value: state },
                React.createElement(
                    FetchersContext.Provider,
                    { value: fetchers as any },
                    children,
                ),
            ),
    };
}

const selectLamports = (account: Account) => account.lamports;

describe('useAccountQuery', () => {
    it('should return disabled state when key is undefined', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountQuery(undefined, { select: selectLamports }), { wrapper });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
    });

    it('should trigger fetch when cache entry is missing', () => {
        const { wrapper, fetchSpy } = createWrapper();
        renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(fetchSpy).toHaveBeenCalledOnce();
        expect(fetchSpy.mock.calls[0][0].toBase58()).toBe(TEST_ADDRESS);
    });

    it('should not trigger fetch when cache entry exists', () => {
        const { wrapper, fetchSpy } = createWrapper({
            [TEST_ADDRESS]: { data: makeAccount(TEST_ADDRESS), status: FetchStatus.Fetched },
        });
        renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return selected data when cache entry is fetched', () => {
        const account = makeAccount(TEST_ADDRESS);
        account.lamports = 42;
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { data: account, status: FetchStatus.Fetched },
        });
        const { result } = renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(result.current.data).toBe(42);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
    });

    it('should return isLoading true when entry is in Fetching status', () => {
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { status: FetchStatus.Fetching },
        });
        const { result } = renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });

    it('should return isError true when fetch failed', () => {
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { status: FetchStatus.FetchFailed },
        });
        const { result } = renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(result.current.isError).toBe(true);
        expect(result.current.isLoading).toBe(false);
    });

    it('should return isLoading true when entry does not exist yet', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectLamports }), { wrapper });

        expect(result.current.isLoading).toBe(true);
    });

    it('should return undefined from select when data does not match', () => {
        const account = makeAccount(TEST_ADDRESS);
        const { wrapper } = createWrapper({
            [TEST_ADDRESS]: { data: account, status: FetchStatus.Fetched },
        });
        const selectNothing = () => undefined;
        const { result } = renderHook(() => useAccountQuery([TEST_ADDRESS], { select: selectNothing }), { wrapper });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });
});
