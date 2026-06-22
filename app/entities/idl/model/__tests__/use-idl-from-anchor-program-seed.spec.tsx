import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useIdlFromAnchorProgramSeed } from '../use-idl-from-anchor-program-seed';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    resolveAnchorIdlClient: vi.fn(),
}));

vi.stubGlobal('fetch', mocks.fetch);
vi.mock('../../api/load-resolve-program-idls', () => ({ resolveAnchorIdlClient: mocks.resolveAnchorIdlClient }));

const PROGRAM = '72RmHgLprptX1iZDJqmMD5vroTqo8N2tJ6YWoFjFNDgj';
const ANCHOR_IDL = { instructions: [], name: 'anchor_idl' };

// shouldRetryOnError: false so a throwing fetcher settles deterministically within the test instead
// of scheduling backoff timers; a fresh cache per render so keys don't bleed across tests.
function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

describe('useIdlFromAnchorProgramSeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should read idls.anchor from /api/idl-latest on a known cluster', async () => {
        mocks.fetch.mockResolvedValue({ json: async () => ({ idls: { anchor: ANCHOR_IDL } }), ok: true });

        const { result } = renderHook(
            () => useIdlFromAnchorProgramSeed(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.idl).toEqual(ANCHOR_IDL));
        const requestedUrl = mocks.fetch.mock.calls[0]?.[0] as string;
        expect(requestedUrl).toContain('/api/idl-latest');
        expect(mocks.resolveAnchorIdlClient).not.toHaveBeenCalled();
    });

    it('should not cache a transient 502 as "no IDL" (throws so SWR errors instead of storing null)', async () => {
        // The bug this guards: returning null on a 502 would be cached by useSWRImmutable as a
        // successful "no Anchor IDL" for the session. The fetcher now throws, so SWR holds an error
        // state (idl null, but not a cached success) — a key change / retry can still recover.
        mocks.fetch.mockResolvedValue({ ok: false, status: 502 });

        const { result } = renderHook(
            () => useIdlFromAnchorProgramSeed(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.idl).toBeNull();
        expect(mocks.fetch).toHaveBeenCalled();
    });

    it('should resolve client-side via @solana/idl on a custom/localhost cluster', async () => {
        mocks.resolveAnchorIdlClient.mockResolvedValue(ANCHOR_IDL);

        const { result } = renderHook(
            () => useIdlFromAnchorProgramSeed(PROGRAM, 'http://localhost:8899', Cluster.Custom),
            {
                wrapper,
            },
        );

        await waitFor(() => expect(result.current.idl).toEqual(ANCHOR_IDL));
        expect(mocks.resolveAnchorIdlClient).toHaveBeenCalledWith(
            expect.objectContaining({ programId: PROGRAM, url: 'http://localhost:8899' }),
        );
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('should resolve client-side when a known cluster points at a localhost RPC', async () => {
        // shouldUseDirectRpc: a known-cluster session whose RPC URL is localhost can't be reached by
        // the server route, so it must resolve in the browser — matching the IDL card's useProgramIdls.
        // Guarding only on Cluster.Custom here would send the decoder to /api/idl-latest while the card
        // resolved client-side, surfacing mismatched IDLs for the same program.
        mocks.resolveAnchorIdlClient.mockResolvedValue(ANCHOR_IDL);

        const { result } = renderHook(
            () => useIdlFromAnchorProgramSeed(PROGRAM, 'http://localhost:8899', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.idl).toEqual(ANCHOR_IDL));
        expect(mocks.resolveAnchorIdlClient).toHaveBeenCalledWith(
            expect.objectContaining({ programId: PROGRAM, url: 'http://localhost:8899' }),
        );
        expect(mocks.fetch).not.toHaveBeenCalled();
    });
});
