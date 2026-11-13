import { GENESIS_HASHES } from '@entities/chain-id';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gen } from '@/app/__fixtures__/gen';
import { Logger } from '@/app/shared/lib/logger';

import { tokenInfo } from '../../__fixtures__/token-info';
import type { TokenInfo } from '../../lib/types';
import { getTokenInfosWithMetaplexFallback } from '../get-token-infos-with-metaplex-fallback';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);
const MINT_C = gen.address(3);
const MAINNET_RPC_URL = 'https://mainnet.rpc.test';

const mocks = vi.hoisted(() => ({
    getTokenInfos: vi.fn(),
    getTokenInfosFromMetaplex: vi.fn(),
}));

vi.mock('../fetch-token-infos-from-jupiter', () => ({ getTokenInfos: mocks.getTokenInfos }));
vi.mock('../fetch-token-metaplex', () => ({ getTokenInfosFromMetaplex: mocks.getTokenInfosFromMetaplex }));

beforeEach(() => {
    vi.stubEnv('MAINNET_RPC_URL', MAINNET_RPC_URL);
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    mocks.getTokenInfosFromMetaplex.mockResolvedValue([]);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    mocks.getTokenInfos.mockReset();
    mocks.getTokenInfosFromMetaplex.mockReset();
});

describe('getTokenInfosWithMetaplexFallback', () => {
    it('should pass the cluster, the genesis hash and the signal to Jupiter', async () => {
        mocks.getTokenInfos.mockResolvedValue(resolved([]));
        const signal = new AbortController().signal;

        await getTokenInfosWithMetaplexFallback({
            addresses: [MINT_A],
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
            signal,
        });

        expect(mocks.getTokenInfos).toHaveBeenCalledWith([MINT_A], Cluster.Custom, GENESIS_HASHES.MAINNET, { signal });
    });

    it('should add the on-chain token info of the mints Jupiter does not list', async () => {
        mocks.getTokenInfos.mockResolvedValue(resolved([tokenInfo(MINT_A, true)], 1));
        mocks.getTokenInfosFromMetaplex.mockResolvedValue([tokenInfo(MINT_C)]);

        const result = await lookup([MINT_A, MINT_B, MINT_C]);

        expect(mocks.getTokenInfosFromMetaplex).toHaveBeenCalledWith([MINT_B, MINT_C], MAINNET_RPC_URL, {
            onError: expect.any(Function),
        });
        expect(result).toEqual(resolved([tokenInfo(MINT_A, true), tokenInfo(MINT_C)], 1));
    });

    it('should not read on-chain metadata when Jupiter lists every mint', async () => {
        mocks.getTokenInfos.mockResolvedValue(resolved([tokenInfo(MINT_A, true), tokenInfo(MINT_B, true)]));

        const result = await lookup([MINT_A, MINT_B]);

        expect(result).toEqual(resolved([tokenInfo(MINT_A, true), tokenInfo(MINT_B, true)]));
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should not read on-chain metadata on a custom cluster', async () => {
        mocks.getTokenInfos.mockResolvedValue(resolved([]));

        const result = await lookup([MINT_A], Cluster.Custom, GENESIS_HASHES.MAINNET);

        expect(result).toEqual(resolved([]));
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });

    it('should answer the Jupiter tokens and warn when the on-chain read throws', async () => {
        mocks.getTokenInfos.mockResolvedValue(resolved([tokenInfo(MINT_A, true)]));
        mocks.getTokenInfosFromMetaplex.mockRejectedValue(new Error('rpc failed'));

        const result = await lookup([MINT_A, MINT_B]);

        expect(result).toEqual(resolved([tokenInfo(MINT_A, true)]));
        expect(Logger.warn).toHaveBeenCalledWith('[api:token-info] Metaplex fallback failed', {
            error: expect.any(Error),
        });
    });

    it('should answer a Jupiter failure without an on-chain read', async () => {
        const unavailable = { error: new Error('upstream failed'), kind: 'unavailable' };
        mocks.getTokenInfos.mockResolvedValue(unavailable);

        const result = await lookup([MINT_A]);

        expect(result).toBe(unavailable);
        expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
    });
});

function lookup(addresses: string[], cluster: Cluster = Cluster.MainnetBeta, genesisHash?: string) {
    return getTokenInfosWithMetaplexFallback({ addresses, cluster, genesisHash, signal: new AbortController().signal });
}

function resolved(tokens: TokenInfo[], malformed = 0) {
    return { kind: 'resolved', malformed, tokens };
}
