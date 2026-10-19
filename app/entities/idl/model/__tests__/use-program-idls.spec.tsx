import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import { renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Cluster } from '@/app/utils/cluster';

import { customIdlStorage } from '../../api/custom-idl-storage';
import { type ProgramIdls, useProgramIdls } from '../use-program-idls';

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

const SwrWrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

// A fresh Jotai store per render, so one test's custom IDLs never reach the next.
function wrapper({ children }: { children: ReactNode }) {
    return (
        <JotaiProvider>
            <SwrWrapper>{children}</SwrWrapper>
        </JotaiProvider>
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

            await waitForHook(() => expect(result.current.onChain.anchorIdl).toEqual({ name: 'anchor_idl' }));
            expect(result.current.onChain.programMetadataIdl).toEqual({ name: 'pmp_idl' });

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

            await waitForHook(() => expect(result.current.isOnChainLoading).toBe(false));
            expect(result.current.onChain.anchorIdl).toBeUndefined();
            expect(result.current.onChain.programMetadataIdl).toBeUndefined();
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

            await waitForHook(() => expect(result.current.onChain.anchorIdl).toEqual({ name: 'custom_anchor_idl' }));
            expect(result.current.onChain.programMetadataIdl).toEqual({ name: 'custom_pmp_idl' });
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

            await waitForHook(() => expect(result.current.isOnChainLoading).toBe(false));
            expect(result.current.onChain.anchorIdl).toBeUndefined();
            expect(result.current.onChain.programMetadataIdl).toBeUndefined();
        });
    });

    // A known cluster can still point at a local validator (e.g. MainnetBeta + http://localhost:8899).
    // `shouldUseDirectRpc` returns true for that combination, so resolution must run client-side against
    // the localhost RPC — loading from the local validator, never from real mainnet via the server route.
    describe('known cluster pointed at a local validator', () => {
        it('should resolve client-side against localhost for MainnetBeta + http://localhost:8899', async () => {
            mocks.resolveProgramIdlsClient.mockResolvedValue({
                anchorIdl: { name: 'local_anchor_idl' },
                programMetadataIdl: undefined,
            });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitForHook(() => expect(result.current.onChain.anchorIdl).toEqual({ name: 'local_anchor_idl' }));
            // Resolved against the user's local RPC URL (the correct network)...
            expect(mocks.resolveProgramIdlsClient).toHaveBeenCalledWith(
                expect.objectContaining({ programId: PROGRAM_ID, url: 'http://localhost:8899' }),
            );
            // ...and the mainnet server route was never queried, so we never read mainnet for a local URL.
            expect(mocks.fetch).not.toHaveBeenCalled();
        });
    });

    describe('candidates', () => {
        it('should list the PMP IDL before the Anchor IDL account', async () => {
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

            await waitForHook(() => expect(result.current.candidates).toBeDefined());
            expect(result.current.candidates?.map(candidate => candidate.source)).toEqual([
                'programMetadata',
                'anchor',
            ]);
        });

        it('should return no candidates while the on-chain IDLs load', async () => {
            mocks.fetch.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitForHook(() => expect(mocks.fetch).toHaveBeenCalled());
            expect(result.current.isOnChainLoading).toBe(true);
            expect(result.current.candidates).toBeUndefined();
        });
    });

    describe('custom IDL', () => {
        const CUSTOM_PROGRAM_ID = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
        const MAINNET_URL = 'https://api.mainnet-beta.solana.com';

        beforeEach(() => {
            mocks.fetch.mockResolvedValue({
                json: async () => ({ idls: { programMetadata: { name: 'pmp_idl' } } }),
                ok: true,
            });
        });

        it('should return the custom IDL in the first render with candidates', async () => {
            await storeCustomIdl('custom');
            const renders: ProgramIdls[] = [];

            renderHook(
                () => {
                    const idls = useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta);
                    renders.push(idls);
                    return idls;
                },
                { wrapper },
            );

            await waitForHook(() => expect(renders.at(-1)?.candidates).toBeDefined());
            const firstReady = renders.find(render => render.candidates !== undefined);
            expect(firstReady?.candidates?.map(candidate => candidate.source)).toEqual(['custom']);
        });

        it.each([
            ['devnet', Cluster.Devnet, 'https://api.devnet.solana.com'],
            ['a custom cluster', Cluster.Custom, 'http://localhost:8899'],
        ])('should return the selected custom IDL on %s too', async (_, cluster, url) => {
            await storeCustomIdl('custom');

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, url, cluster), { wrapper });

            await waitForHook(() => expect(result.current.candidates).toBeDefined());
            expect(result.current.candidates?.map(candidate => candidate.source)).toEqual(['custom']);
        });

        it('should return no candidates while the store reads the stored selection', async () => {
            await storeCustomIdl('custom');
            vi.spyOn(customIdlStorage, 'list').mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.onChain.programMetadataIdl).toBeDefined());
            expect(result.current.stored).toEqual({ status: 'loading' });
            expect(result.current.candidates).toBeUndefined();
        });

        it('should not wait for the on-chain fetch when Custom is selected', async () => {
            await storeCustomIdl('custom');
            mocks.fetch.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.candidates).toBeDefined());
            expect(result.current.isOnChainLoading).toBe(true);
            expect(result.current.candidates?.map(candidate => candidate.source)).toEqual(['custom']);
        });

        it('should wait for the on-chain fetch when On-chain is selected', async () => {
            await storeCustomIdl('onChain');
            mocks.fetch.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.stored).toMatchObject({ record: { selected: 'onChain' } }));
            expect(result.current.candidates).toBeUndefined();
        });

        it('should wait for the on-chain fetch when the program has no custom IDL', async () => {
            mocks.fetch.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.stored).toEqual({ record: undefined, status: 'ready' }));
            expect(result.current.candidates).toBeUndefined();
        });

        it('should return the on-chain candidates when the browser blocks storage', async () => {
            await storeCustomIdl('custom');
            vi.spyOn(indexedDB, 'open').mockImplementation(() => {
                throw new DOMException('blocked', 'SecurityError');
            });

            const { result } = renderHook(() => useProgramIdls(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.candidates).toBeDefined());
            expect(result.current.stored).toEqual({ status: 'failed' });
            expect(result.current.candidates?.map(candidate => candidate.source)).toEqual(['programMetadata']);
        });

        it('should return the on-chain candidates when the decoder check does not load', async () => {
            await storeCustomIdl('custom');
            vi.resetModules();
            vi.doMock('../custom-idl/can-decoder-load', () => {
                throw new Error('ChunkLoadError');
            });
            try {
                const { useProgramIdls: useProgramIdlsWithoutDecoders } = await import('../use-program-idls');

                const { result } = renderHook(
                    () => useProgramIdlsWithoutDecoders(CUSTOM_PROGRAM_ID, MAINNET_URL, Cluster.MainnetBeta),
                    { wrapper },
                );

                await waitForHook(() => expect(result.current.candidates).toBeDefined());
                expect(result.current.stored).toEqual({ status: 'failed' });
                expect(result.current.candidates?.map(candidate => candidate.source)).toEqual(['programMetadata']);
            } finally {
                vi.doUnmock('../custom-idl/can-decoder-load');
            }
        });

        function storeCustomIdl(selected: string) {
            return customIdlStorage.put({
                programAddress: CUSTOM_PROGRAM_ID,
                value: JSON.stringify({ idl: anchorModernIdl, origin: { kind: 'pasted' }, selected }),
            });
        }
    });
});
