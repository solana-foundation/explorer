import { type Account } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, renderHook, type RenderHookResult, screen, waitFor } from '@testing-library/react';
import { Cluster, clusterSelection, clusterUrl } from '@utils/cluster';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rpcStub } from '@/app/__tests__/mock-rpc';

const { useClusterMock, getTokenAccountsByOwner } = vi.hoisted(() => ({
    getTokenAccountsByOwner: vi.fn(),
    useClusterMock: vi.fn(),
}));

vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return { ...actual, getRpc: () => rpcStub({ getTokenAccountsByOwner }) };
});

import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';

import {
    type ScaledUiAmountMultiplier,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TokensProvider,
    useAccountOwnedTokens,
    useFetchAccountOwnedTokens,
    useScaledUiAmountMultiplier,
} from '../tokens';

const OWNER = PublicKey.default.toBase58();
const MINT = new PublicKey('So11111111111111111111111111111111111111112').toBase58();
const TOKEN_ACCOUNT_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');

/**
 * Minimal shape that satisfies the TokenAccountInfo superstruct schema (mint/owner coerced from
 * base58), plus a token-2022 extension.
 *
 * kit upcasts every integral field of a jsonParsed response to a bigint unless its key path is
 * allow-listed. `tokenAmount.decimals` is on that list and stays a number; nothing under
 * `extensions[].state` is, so `withheldAmount` arrives as a bigint even though the extension
 * schemas type it as `number()`.
 */
function makeParsedTokenAccount(pubkey: PublicKey) {
    return {
        account: {
            data: {
                parsed: {
                    info: {
                        extensions: [{ extension: 'transferFeeAmount', state: { withheldAmount: 42n } }],
                        isNative: false,
                        mint: MINT,
                        owner: OWNER,
                        state: 'initialized',
                        tokenAmount: { amount: '1000', decimals: 0, uiAmountString: '1000' },
                    },
                },
            },
        },
        pubkey: pubkey.toBase58(),
    };
}

function TestComponent() {
    const entry = useAccountOwnedTokens(OWNER);
    const fetchTokens = useFetchAccountOwnedTokens();
    React.useEffect(() => {
        fetchTokens(new PublicKey(OWNER));
    }, [fetchTokens]);

    if (!entry) return null;
    return (
        <div>
            <span data-testid="fetch-status">{entry.status}</span>
            <span data-testid="token-count">{entry.data?.tokens?.length ?? 0}</span>
            {entry.data?.tokens?.map((t, i) => (
                <span key={i} data-testid="token-row">
                    {t.info.mint.toBase58()}
                </span>
            ))}
            <span data-testid="first-extensions">
                {JSON.stringify(entry.data?.tokens?.[0]?.info.extensions ?? null)}
            </span>
        </div>
    );
}

function renderTokens() {
    render(
        <TokensProvider>
            <TestComponent />
        </TokensProvider>,
    );
    return waitFor(() => expect(screen.getByTestId('fetch-status').textContent).toBe(String(FetchStatus.Fetched)));
}

describe('should fetch account token holdings without enrichment', () => {
    beforeEach(() => {
        const selection = clusterSelection(Cluster.Devnet);
        useClusterMock.mockReturnValue({ ...selection, selection, url: clusterUrl(selection) });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('should return every token account with extension state as numbers, not bigints', async () => {
        // Legacy SPL program -> one holding. Token-2022 -> none.
        getTokenAccountsByOwner
            .mockResolvedValueOnce({ context: { slot: 0n }, value: [makeParsedTokenAccount(TOKEN_ACCOUNT_PUBKEY)] })
            .mockResolvedValueOnce({ context: { slot: 0n }, value: [] });

        await renderTokens();

        expect(screen.getByTestId('token-count').textContent).toBe('1');
        expect(screen.getByTestId('token-row').textContent).toBe(MINT);
        // A bigint anywhere in the payload would have thrown inside JSON.stringify.
        expect(JSON.parse(screen.getByTestId('first-extensions').textContent ?? 'null')).toEqual([
            { extension: 'transferFeeAmount', state: { withheldAmount: 42 } },
        ]);
    });

    it('should query both token programs and merge the holdings', async () => {
        getTokenAccountsByOwner
            .mockResolvedValueOnce({ context: { slot: 0n }, value: [makeParsedTokenAccount(TOKEN_ACCOUNT_PUBKEY)] })
            .mockResolvedValueOnce({
                context: { slot: 0n },
                value: [makeParsedTokenAccount(new PublicKey(new Uint8Array(32).fill(7)))],
            });

        await renderTokens();

        expect(screen.getByTestId('token-count').textContent).toBe('2');
        expect(getTokenAccountsByOwner.mock.calls.map(call => call[1].programId)).toEqual([
            TOKEN_PROGRAM_ID.toBase58(),
            TOKEN_2022_PROGRAM_ID.toBase58(),
        ]);
    });

    it('should not cap the number of holdings at 101', async () => {
        const many = Array.from({ length: 150 }, (_, i) =>
            makeParsedTokenAccount(new PublicKey(new Uint8Array(32).fill((i % 254) + 1))),
        );
        getTokenAccountsByOwner
            .mockResolvedValueOnce({ context: { slot: 0n }, value: many })
            .mockResolvedValueOnce({ context: { slot: 0n }, value: [] });

        await renderTokens();

        expect(screen.getByTestId('token-count').textContent).toBe('150');
    });
});

describe('useScaledUiAmountMultiplier', () => {
    it('should return the multiplier of the mint', () => {
        const { result } = renderScaledUiAmountMultiplier({ ...MINT_INFO, extensions: [SCALED_UI_AMOUNT_EXTENSION] });

        expect(result.current).toEqual({ multiplier: '2', status: 'known' });
    });

    it('should return an unknown multiplier when the mint does not parse', () => {
        const { result } = renderScaledUiAmountMultiplier({
            ...MINT_INFO,
            extensions: [SCALED_UI_AMOUNT_EXTENSION],
            supply: undefined,
        });

        expect(result.current).toEqual({ status: 'unknown' });
    });

    it('should return a multiplier of 1 when the mint is not fetched', () => {
        const { result } = renderScaledUiAmountMultiplier();

        expect(result.current).toEqual({ multiplier: '1', status: 'known' });
    });
});

const MINT_INFO = {
    decimals: 0,
    freezeAuthority: null,
    isInitialized: true,
    mintAuthority: null,
    supply: '1000',
};

const SCALED_UI_AMOUNT_EXTENSION = {
    extension: 'scaledUiAmountConfig',
    state: { authority: null, multiplier: '2', newMultiplier: '2', newMultiplierEffectiveTimestamp: 0 },
};

function renderScaledUiAmountMultiplier(
    mintInfo?: Record<string, unknown>,
): RenderHookResult<ScaledUiAmountMultiplier, unknown> {
    const accounts = mintInfo ? { [MINT]: { data: toMintAccount(mintInfo), status: FetchStatus.Fetched } } : {};
    return renderHook(() => useScaledUiAmountMultiplier(MINT), {
        wrapper: ({ children }) => (
            <MockClusterProvider>
                <MockAccountsProvider accounts={accounts}>{children}</MockAccountsProvider>
            </MockClusterProvider>
        ),
    });
}

function toMintAccount(mintInfo: Record<string, unknown>): Account {
    return {
        data: { parsed: { parsed: { info: mintInfo, type: 'mint' }, program: 'spl-token-2022' } },
        executable: false,
        lamports: 1,
        owner: TOKEN_2022_PROGRAM_ID,
        pubkey: new PublicKey(MINT),
    };
}
