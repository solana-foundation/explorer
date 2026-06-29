import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPmpSecurityTxt } from '@/app/features/security-txt/ui/__tests__/helpers';
import { Cluster } from '@/app/utils/cluster';

import { useSecurityTxt } from '../useSecurityTxt';

const PROGRAM = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.stubGlobal('fetch', mocks.fetch);

// Known cluster → the hook hits the cached `/api/security-txt` route (mocked via global fetch).
vi.mock('@/app/providers/cluster', () => ({
    useCluster: vi.fn(() => ({ cluster: Cluster.MainnetBeta, url: 'https://api.mainnet-beta.solana.com' })),
}));

// Fresh SWR cache per render; no retries so a throwing fetcher settles within the test.
function wrapper({ children }: { children: ReactNode }) {
    return createElement(
        SWRConfig,
        { value: { dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false } },
        children,
    );
}

describe('useSecurityTxt', () => {
    beforeEach(() => mocks.fetch.mockReset());
    afterEach(() => vi.clearAllMocks());

    it('should map the /api/security-txt payload', async () => {
        const securityTxt = createPmpSecurityTxt();
        mocks.fetch.mockResolvedValue({ json: async () => ({ securityTxt }), ok: true });

        const { result } = renderHook(() => useSecurityTxt(PROGRAM), { wrapper });

        await waitFor(() => expect(result.current.securityTxt).toEqual(securityTxt));
        expect(mocks.fetch.mock.calls[0]?.[0] as string).toContain('/api/security-txt');
    });

    it('should be undefined when the route returns no security.txt', async () => {
        mocks.fetch.mockResolvedValue({ json: async () => ({}), ok: true });

        const { result } = renderHook(() => useSecurityTxt(PROGRAM), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.securityTxt).toBeUndefined();
    });
});
