import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';
import { Cluster } from '@/app/utils/cluster';

import { IdlVariant } from '../idl-variant';
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

const wrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

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
        it('should map the /api/idl-latest payload into one IDL per source', async () => {
            const anchor = { metadata: { spec: '0.1.0' }, name: 'anchor_idl' };
            const pmp = { metadata: { spec: '0.1.0' }, name: 'pmp_idl' };
            mocks.fetch.mockResolvedValue({
                json: async () => ({ idls: { anchor, programMetadata: pmp } }),
                ok: true,
            });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitForHook(() => expect(result.current.idls).toBeDefined());
            expect(result.current.idls).toEqual([
                { idl: pmp, idlAddress: undefined, source: IdlVariant.ProgramMetadata, standard: 'Anchor' },
                { idl: anchor, idlAddress: undefined, source: IdlVariant.Anchor, standard: 'Anchor' },
            ]);

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

            await waitForHook(() => expect(result.current.idls).toEqual([]));
        });
    });

    describe('custom / local clusters (client-side @solana/idl resolver)', () => {
        it('should resolve IDLs client-side against the user RPC and never call the server route', async () => {
            const anchorIdl = { metadata: { spec: '0.1.0' }, name: 'custom_anchor_idl' };
            const programMetadataIdl = { metadata: { spec: '0.1.0' }, name: 'custom_pmp_idl' };
            mocks.resolveProgramIdlsClient.mockResolvedValue({ anchorIdl, programMetadataIdl });

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.idls).toBeDefined());
            expect(idlBySource(result.current.idls)).toEqual({
                [IdlVariant.Anchor]: anchorIdl,
                [IdlVariant.ProgramMetadata]: programMetadataIdl,
            });
            // The resolver runs against the user-supplied RPC URL (so localhost works end-to-end).
            expect(mocks.resolveProgramIdlsClient).toHaveBeenCalledWith(
                expect.objectContaining({ programId: PROGRAM_ID, url: 'http://localhost:8899' }),
            );
            // The server route can't reach a user's local validator; custom clusters must not hit it.
            expect(mocks.fetch).not.toHaveBeenCalled();
        });

        it('should return undefined while the client resolver loads', async () => {
            mocks.resolveProgramIdlsClient.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitForHook(() => expect(mocks.resolveProgramIdlsClient).toHaveBeenCalled());
            expect(result.current.idls).toBeUndefined();
        });

        it('should return no IDLs when the resolver throws', async () => {
            mocks.resolveProgramIdlsClient.mockRejectedValue(new Error('connection refused'));

            const { result } = renderHook(() => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.Custom), {
                wrapper,
            });

            await waitForHook(() => expect(result.current.idls).toEqual([]));
        });
    });

    // A known cluster can still point at a local validator (e.g. MainnetBeta + http://localhost:8899).
    // `shouldUseDirectRpc` returns true for that combination, so resolution must run client-side against
    // the localhost RPC — loading from the local validator, never from real mainnet via the server route.
    describe('known cluster pointed at a local validator', () => {
        it('should resolve client-side against localhost for MainnetBeta + http://localhost:8899', async () => {
            const anchorIdl = { metadata: { spec: '0.1.0' }, name: 'local_anchor_idl' };
            mocks.resolveProgramIdlsClient.mockResolvedValue({ anchorIdl, programMetadataIdl: undefined });

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'http://localhost:8899', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitForHook(() =>
                expect(idlBySource(result.current.idls)).toEqual({
                    [IdlVariant.Anchor]: anchorIdl,
                }),
            );
            // Resolved against the user's local RPC URL (the correct network)...
            expect(mocks.resolveProgramIdlsClient).toHaveBeenCalledWith(
                expect.objectContaining({ programId: PROGRAM_ID, url: 'http://localhost:8899' }),
            );
            // ...and the mainnet server route was never queried, so we never read mainnet for a local URL.
            expect(mocks.fetch).not.toHaveBeenCalled();
        });
    });

    describe('idls', () => {
        it('should return undefined while the on-chain IDLs load', async () => {
            mocks.fetch.mockReturnValue(new Promise(() => undefined));

            const { result } = renderHook(
                () => useProgramIdls(PROGRAM_ID, 'https://api.mainnet-beta.solana.com', Cluster.MainnetBeta),
                { wrapper },
            );

            await waitForHook(() => expect(mocks.fetch).toHaveBeenCalled());
            expect(result.current.idls).toBeUndefined();
        });
    });
});

function idlBySource(idls: ProgramIdls['idls']) {
    return Object.fromEntries((idls ?? []).map(({ idl, source }) => [source, idl]));
}
