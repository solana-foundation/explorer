import { IdlVariant } from '@entities/idl';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramIdls } from '../use-program-idls';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    fetchIdlAnchor: vi.fn(),
    useProgramCanonicalMetadata: vi.fn(),
}));

vi.stubGlobal('fetch', mocks.fetch);

vi.mock('@/app/entities/program-metadata/model/use-program-canonical-metadata', () => ({
    useProgramCanonicalMetadata: mocks.useProgramCanonicalMetadata,
}));

// Stub the Anchor client fetch path used for custom/local clusters.
vi.mock('@coral-xyz/anchor', () => ({ Program: { fetchIdl: mocks.fetchIdlAnchor } }));
vi.mock('../../../../entities/idl/model/use-idl-from-anchor-program-seed', () => ({ getProvider: vi.fn(() => ({})) }));

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
        mocks.fetchIdlAnchor.mockReset();
        mocks.useProgramCanonicalMetadata.mockReset();
        // Default: the custom-cluster client hooks resolve to no PMP metadata.
        mocks.useProgramCanonicalMetadata.mockReturnValue({ isLoading: false, programMetadata: undefined });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('known clusters (server route)', () => {
        it('should map the /api/idl-latest payload into the IDL slots + preferred variant', async () => {
            mocks.fetch.mockResolvedValue({
                json: async () => ({
                    idls: {
                        anchor: { name: 'anchor_idl' },
                        preferred: 'anchor',
                        programMetadata: { name: 'pmp_idl' },
                    },
                }),
                ok: true,
            });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitFor(() => expect(result.current.anchorIdl).toEqual({ name: 'anchor_idl' }));
            expect(result.current.programMetadataIdl).toEqual({ name: 'pmp_idl' });
            expect(result.current.preferredVariant).toBe(IdlVariant.Anchor);

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
            expect(result.current.preferredVariant).toBe(IdlVariant.ProgramMetadata);
        });
    });

    describe('custom / local clusters (client fallback)', () => {
        it('should fetch the Anchor IDL client-side and never call the server route', async () => {
            mocks.fetchIdlAnchor.mockResolvedValue({ name: 'custom_anchor_idl' });

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitFor(() => expect(result.current.anchorIdl).toEqual({ name: 'custom_anchor_idl' }));
            expect(result.current.preferredVariant).toBe(IdlVariant.ProgramMetadata);
            // The server route is server-only; custom clusters must not hit it.
            expect(mocks.fetch).not.toHaveBeenCalled();
        });
    });
});
