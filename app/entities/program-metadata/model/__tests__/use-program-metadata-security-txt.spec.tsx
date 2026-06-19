import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useProgramMetadataSecurityTxt } from '../use-program-metadata-security-txt';

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

describe('useProgramMetadataSecurityTxt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should read security.txt from /api/security-txt on a known cluster', async () => {
        mocks.fetch.mockResolvedValue({ json: async () => ({ programMetadata: { contacts: 'x' } }), ok: true });

        const { result } = renderHook(
            () => useProgramMetadataSecurityTxt(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.programMetadataSecurityTxt).toEqual({ contacts: 'x' }));
        expect(mocks.fetch.mock.calls[0]?.[0]).toContain('/api/security-txt');
        expect(mocks.resolvePmpContentClient).not.toHaveBeenCalled();
    });

    it('should resolve client-side canonical-only on a custom/localhost cluster', async () => {
        mocks.resolvePmpContentClient.mockResolvedValue({ contacts: 'local' });

        const { result } = renderHook(
            () => useProgramMetadataSecurityTxt(PROGRAM, 'http://localhost:8899', Cluster.Custom),
            { wrapper },
        );

        await waitFor(() => expect(result.current.programMetadataSecurityTxt).toEqual({ contacts: 'local' }));
        // security.txt never uses the fndn fallback authority (canonical-only).
        expect(mocks.resolvePmpContentClient).toHaveBeenCalledWith(
            expect.objectContaining({ programAddress: PROGRAM, seed: 'security', useFallbackAuthorities: false }),
        );
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('should return null and never fetch when the security.txt flag is disabled', async () => {
        vi.stubEnv('NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED', 'false');

        const { result } = renderHook(
            () => useProgramMetadataSecurityTxt(PROGRAM, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
            { wrapper },
        );

        await waitFor(() => expect(result.current.programMetadataSecurityTxt).toBeUndefined());
        expect(mocks.fetch).not.toHaveBeenCalled();
        expect(mocks.resolvePmpContentClient).not.toHaveBeenCalled();
    });
});
