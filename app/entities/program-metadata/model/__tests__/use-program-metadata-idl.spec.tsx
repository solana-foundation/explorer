import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramMetadataIdl } from '../use-program-metadata-idl';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    resolvePmpContentClient: vi.fn(),
}));

vi.stubGlobal('fetch', mocks.fetch);
vi.mock('../../api/resolve-pmp-content-client', () => ({ resolvePmpContentClient: mocks.resolvePmpContentClient }));

const PROGRAM = '72RmHgLprptX1iZDJqmMD5vroTqo8N2tJ6YWoFjFNDgj';

function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

describe('useProgramMetadataIdl', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_PMP_IDL_ENABLED', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should read idls.programMetadata from /api/idl-latest?anchor=0 on a known cluster', async () => {
        mocks.fetch.mockResolvedValue({
            json: async () => ({ idls: { programMetadata: { name: 'pmp_idl' } } }),
            ok: true,
        });

        const { result } = renderHook(
            () => useProgramMetadataIdl(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.programMetadataIdl).toEqual({ name: 'pmp_idl' }));
        const requestedUrl = mocks.fetch.mock.calls[0]?.[0] as string;
        expect(requestedUrl).toContain('/api/idl-latest');
        expect(requestedUrl).toContain('anchor=0');
        expect(mocks.resolvePmpContentClient).not.toHaveBeenCalled();
    });

    it('should resolve client-side via @solana/idl on a custom/localhost cluster', async () => {
        mocks.resolvePmpContentClient.mockResolvedValue({ name: 'local_pmp_idl' });

        const { result } = renderHook(() => useProgramMetadataIdl(PROGRAM, 'http://localhost:8899', Cluster.Custom), {
            wrapper,
        });

        await waitFor(() => expect(result.current.programMetadataIdl).toEqual({ name: 'local_pmp_idl' }));
        // Custom path uses the fndn fallback authority and never hits the server route.
        expect(mocks.resolvePmpContentClient).toHaveBeenCalledWith(
            expect.objectContaining({ programAddress: PROGRAM, seed: 'idl', useFallbackAuthorities: true }),
        );
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('should not cache a transient API failure (throws so SWR can retry)', async () => {
        mocks.fetch.mockResolvedValue({ ok: false, status: 502 });

        const { result } = renderHook(
            () => useProgramMetadataIdl(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.programMetadataIdl).toBeUndefined();
    });

    it('should return null and never fetch when the PMP IDL flag is disabled', async () => {
        vi.stubEnv('NEXT_PUBLIC_PMP_IDL_ENABLED', 'false');

        const { result } = renderHook(
            () => useProgramMetadataIdl(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.programMetadataIdl).toBeUndefined();
        expect(mocks.fetch).not.toHaveBeenCalled();
        expect(mocks.resolvePmpContentClient).not.toHaveBeenCalled();
    });
});
