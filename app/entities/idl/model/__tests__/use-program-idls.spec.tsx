import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramIdls } from '../use-program-idls';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    resolveProgramIdlsClient: vi.fn(),
}));

vi.stubGlobal('fetch', mocks.fetch);

// Known clusters go through the real `fetchProgramIdls` (global fetch, stubbed above); the custom-
// cluster client resolver is stubbed so the spec asserts behavior without pulling in `@solana/idl`.
vi.mock('../../api/load-resolve-program-idls', () => ({
    resolveProgramIdlsClient: mocks.resolveProgramIdlsClient,
}));

const PROGRAM_ID = '11111111111111111111111111111111';

// A fresh SWR cache per render so keys don't bleed across tests; disable error retries so a
// throwing fetcher resolves deterministically within the test instead of scheduling backoff timers.
function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

describe('useProgramIdls', () => {
    beforeEach(() => {
        mocks.fetch.mockReset();
        mocks.resolveProgramIdlsClient.mockReset();
        // Default: the custom-cluster client resolver finds no IDLs.
        mocks.resolveProgramIdlsClient.mockResolvedValue({
            anchorIdl: undefined,
            programMetadataIdl: undefined,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('known clusters (server route)', () => {
        it('should map the /api/idl-latest payload into the IDL slots', async () => {
            mocks.fetch.mockResolvedValue({
                json: async () => ({
                    idls: { anchor: { name: 'anchor_idl' }, programMetadata: { name: 'pmp_idl' } },
                }),
                ok: true,
            });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitFor(() => expect(result.current.anchorIdl).toEqual({ name: 'anchor_idl' }));
            expect(result.current.programMetadataIdl).toEqual({ name: 'pmp_idl' });

            const requestedUrl = mocks.fetch.mock.calls[0]?.[0] as string;
            expect(requestedUrl).toContain('/api/idl-latest');
            expect(requestedUrl).toContain(`programAddress=${PROGRAM_ID}`);
        });

        it('should fall back to empty IDLs on a non-OK response', async () => {
            mocks.fetch.mockResolvedValue({ ok: false, status: 502 });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.anchorIdl).toBeUndefined();
            expect(result.current.programMetadataIdl).toBeUndefined();
        });
    });

    describe('custom / local clusters (client-side @solana/idl resolver)', () => {
        it('should resolve IDLs client-side against the user RPC and never call the server route', async () => {
            mocks.resolveProgramIdlsClient.mockResolvedValue({
                anchorIdl: { name: 'custom_anchor_idl' },
                programMetadataIdl: { name: 'custom_pmp_idl' },
            });

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitFor(() => expect(result.current.anchorIdl).toEqual({ name: 'custom_anchor_idl' }));
            expect(result.current.programMetadataIdl).toEqual({ name: 'custom_pmp_idl' });
            // The resolver runs against the user-supplied RPC URL (so localhost works end-to-end).
            expect(mocks.resolveProgramIdlsClient).toHaveBeenCalledWith(
                expect.objectContaining({ programId: PROGRAM_ID, url: 'http://localhost:8899' }),
            );
            // The server route can't reach a user's local validator; custom clusters must not hit it.
            expect(mocks.fetch).not.toHaveBeenCalled();
        });

        it('should fall back to undefined IDLs when the resolver throws', async () => {
            mocks.resolveProgramIdlsClient.mockRejectedValue(new Error('connection refused'));

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitFor(() => expect(result.current.isLoading).toBe(false));
            expect(result.current.anchorIdl).toBeUndefined();
            expect(result.current.programMetadataIdl).toBeUndefined();
        });
    });
});
