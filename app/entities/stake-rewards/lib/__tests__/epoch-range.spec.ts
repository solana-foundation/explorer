import { Cluster } from '@utils/cluster';
import { describe, expect, it } from 'vitest';

import { getRewardEpochRange } from '../epoch-range';

describe('getRewardEpochRange', () => {
    it('should run from the creation epoch to the previous epoch', () => {
        expect(getRewardEpochRange(makeRangeInput())).toEqual({ fromEpoch: 943, toEpoch: 1011 });
    });

    it('should exclude the current epoch, which has paid nothing yet', () => {
        expect(getRewardEpochRange(makeRangeInput({ currentEpoch: 1012 }))?.toEpoch).toBe(1011);
    });

    it('should start before a re-delegated account activation epoch', () => {
        // `MCrWxQJgT3VogbgM5sy78K4uCEmwPQiKeXG2Bna51zs` was created in epoch 844 and reports
        // `activationEpoch` 1005. Starting at 1005 reported 10,482,997 of 55,208,535 lamports.
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 844 }))).toEqual({
            fromEpoch: 844,
            toEpoch: 1011,
        });
    });

    it('should floor the start at the first mainnet epoch that paid inflation rewards', () => {
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 10 }))).toEqual({
            fromEpoch: 132,
            toEpoch: 1011,
        });
    });

    it('should use the testnet floor on testnet', () => {
        const input = makeRangeInput({ cluster: Cluster.Testnet, creationEpoch: 10, currentEpoch: 500 });

        expect(getRewardEpochRange(input)).toEqual({ fromEpoch: 43, toEpoch: 499 });
    });

    it('should apply no floor to clusters without a known first reward epoch', () => {
        const input = makeRangeInput({ cluster: Cluster.Devnet, creationEpoch: 10, currentEpoch: 500 });

        expect(getRewardEpochRange(input)).toEqual({ fromEpoch: 10, toEpoch: 499 });
    });

    it('should keep the creation epoch when it is later than the floor', () => {
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 400 }))).toEqual({
            fromEpoch: 400,
            toEpoch: 1011,
        });
    });

    it('should end at the deactivation epoch once the account has stopped earning', () => {
        expect(getRewardEpochRange(makeRangeInput({ deactivationEpoch: 1000 }))).toEqual({
            fromEpoch: 943,
            toEpoch: 1000,
        });
    });

    it('should ignore a deactivation epoch that has not been reached yet', () => {
        expect(getRewardEpochRange(makeRangeInput({ deactivationEpoch: 1050 }))).toEqual({
            fromEpoch: 943,
            toEpoch: 1011,
        });
    });

    it('should treat an unstripped u64::MAX sentinel as still delegated', () => {
        const input = makeRangeInput({ deactivationEpoch: Number(0xffffffffffffffffn) });

        expect(getRewardEpochRange(input)).toEqual({ fromEpoch: 943, toEpoch: 1011 });
    });

    it('should return a single epoch when the account was created one epoch ago', () => {
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 1011 }))).toEqual({
            fromEpoch: 1011,
            toEpoch: 1011,
        });
    });

    it('should return undefined when the account was created this epoch', () => {
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 1012 }))).toBeUndefined();
    });

    it('should return undefined when the account deactivated before its first reward epoch', () => {
        expect(getRewardEpochRange(makeRangeInput({ deactivationEpoch: 942 }))).toBeUndefined();
    });

    it('should return undefined when the whole range predates the cluster floor', () => {
        expect(getRewardEpochRange(makeRangeInput({ creationEpoch: 10, currentEpoch: 100 }))).toBeUndefined();
    });
});

type RangeInput = Parameters<typeof getRewardEpochRange>[0];

/** A mainnet account created in epoch 943 and still delegated, queried during epoch 1012. */
function makeRangeInput(overrides: Partial<RangeInput> = {}): RangeInput {
    return {
        cluster: Cluster.MainnetBeta,
        creationEpoch: 943,
        currentEpoch: 1012,
        ...overrides,
    };
}
