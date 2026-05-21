import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { useIdlFromAnchorProgramSeed } from '../use-idl-from-anchor-program-seed';

describe('useIdlFromAnchorProgramSeed', () => {
    const url = 'https://any.rpc.address';

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should not fire duplicate /api/anchor requests for the same key while the request is in flight', () => {
        const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
        vi.stubGlobal('fetch', fetchMock);

        const programAddress = PublicKey.unique().toBase58();

        let firstThrown: unknown;
        let secondThrown: unknown;

        try {
            useIdlFromAnchorProgramSeed(programAddress, url, Cluster.MainnetBeta);
        } catch (e) {
            firstThrown = e;
        }
        try {
            useIdlFromAnchorProgramSeed(programAddress, url, Cluster.MainnetBeta);
        } catch (e) {
            secondThrown = e;
        }

        expect(firstThrown).toBeInstanceOf(Promise);
        expect(secondThrown).toBe(firstThrown);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not call Program.fetchIdl twice for the same key while the request is in flight on a Custom cluster', () => {
        const fetchIdlSpy = vi.spyOn(Program, 'fetchIdl').mockReturnValue(new Promise(() => {}));

        const programAddress = PublicKey.unique().toBase58();

        let firstThrown: unknown;
        let secondThrown: unknown;

        try {
            useIdlFromAnchorProgramSeed(programAddress, url, Cluster.Custom);
        } catch (e) {
            firstThrown = e;
        }
        try {
            useIdlFromAnchorProgramSeed(programAddress, url, Cluster.Custom);
        } catch (e) {
            secondThrown = e;
        }

        expect(firstThrown).toBeInstanceOf(Promise);
        expect(secondThrown).toBe(firstThrown);
        expect(fetchIdlSpy).toHaveBeenCalledTimes(1);
    });
});
