import { FetchStatus } from '@providers/cache';
import { Connection, PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import { Cluster, clusterUrl } from '@utils/cluster';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useClusterMock } = vi.hoisted(() => ({ useClusterMock: vi.fn() }));
vi.mock('@providers/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@providers/cluster')>();
    return { ...actual, useCluster: useClusterMock };
});

vi.mock('@/app/shared/lib/logger', () => ({
    Logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { TokensProvider, useAccountOwnedTokens, useFetchAccountOwnedTokens } from '../tokens';

const OWNER = PublicKey.default.toBase58();
const MINT = new PublicKey('So11111111111111111111111111111111111111112').toBase58();
const TOKEN_ACCOUNT_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');

// Minimal shape that satisfies the TokenAccountInfo superstruct schema (mint/owner coerced from base58).
function makeParsedTokenAccount(pubkey: PublicKey) {
    return {
        account: {
            data: {
                parsed: {
                    info: {
                        isNative: false,
                        mint: MINT,
                        owner: OWNER,
                        state: 'initialized',
                        tokenAmount: { amount: '1000', decimals: 0, uiAmountString: '1000' },
                    },
                },
            },
        },
        pubkey,
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
        </div>
    );
}

describe('should fetch account token holdings without enrichment', () => {
    beforeEach(() => {
        useClusterMock.mockReturnValue({
            cluster: Cluster.Devnet,
            customUrl: '',
            url: clusterUrl(Cluster.Devnet, ''),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('should return every token account without enriching metadata', async () => {
        vi.spyOn(Connection.prototype, 'getParsedTokenAccountsByOwner')
            // Legacy SPL program -> one holding. Token-2022 -> none.
            .mockResolvedValueOnce({
                context: { slot: 0 },
                value: [makeParsedTokenAccount(TOKEN_ACCOUNT_PUBKEY)],
            } as any)
            .mockResolvedValueOnce({ context: { slot: 0 }, value: [] } as any);

        render(
            <TokensProvider>
                <TestComponent />
            </TokensProvider>,
        );

        await waitFor(() => expect(screen.getByTestId('fetch-status').textContent).toBe(String(FetchStatus.Fetched)));
        expect(screen.getByTestId('token-count').textContent).toBe('1');
        expect(screen.getByTestId('token-row').textContent).toBe(MINT);
    });

    it('should not cap the number of holdings at 101', async () => {
        const many = Array.from({ length: 150 }, (_, i) =>
            makeParsedTokenAccount(new PublicKey(new Uint8Array(32).fill((i % 254) + 1))),
        );
        vi.spyOn(Connection.prototype, 'getParsedTokenAccountsByOwner')
            .mockResolvedValueOnce({ context: { slot: 0 }, value: many } as any)
            .mockResolvedValueOnce({ context: { slot: 0 }, value: [] } as any);

        render(
            <TokensProvider>
                <TestComponent />
            </TokensProvider>,
        );

        await waitFor(() => expect(screen.getByTestId('fetch-status').textContent).toBe(String(FetchStatus.Fetched)));
        expect(screen.getByTestId('token-count').textContent).toBe('150');
    });
});
