import { describe, expect, it } from 'vitest';

import { identifyVoteInstruction, VoteInstruction } from '../index';

describe('identifyVoteInstruction', () => {
    it('should read the little-endian u32 discriminant', () => {
        expect(identifyVoteInstruction(new Uint8Array([14, 0, 0, 0, 0xff]))).toBe(VoteInstruction.TowerSync);
        expect(identifyVoteInstruction(new Uint8Array([19, 0, 0, 0]))).toBe(VoteInstruction.DepositDelegatorRewards);
    });

    it('should throw on a discriminant past the last variant', () => {
        expect(() => identifyVoteInstruction(new Uint8Array([20, 0, 0, 0]))).toThrow();
    });

    it('should throw on data shorter than the discriminant', () => {
        expect(() => identifyVoteInstruction(new Uint8Array([2, 0]))).toThrow();
    });
});
