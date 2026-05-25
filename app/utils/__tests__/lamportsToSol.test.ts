import { LAMPORTS_PER_SOL, lamportsToSol } from '@utils/index';

describe('lamportsToSol', () => {
    it('should convert 0 lamports to 0 SOL', () => {
        expect(lamportsToSol(0)).toBe(0.0);
        expect(lamportsToSol(BigInt(0))).toBe(0.0);
    });

    it('should convert 1 lamport to SOL for positive and negative values', () => {
        expect(lamportsToSol(1)).toBe(0.000000001);
        expect(lamportsToSol(BigInt(1))).toBe(0.000000001);
        expect(lamportsToSol(-1)).toBe(-0.000000001);
        expect(lamportsToSol(BigInt(-1))).toBe(-0.000000001);
    });

    it('should convert LAMPORTS_PER_SOL to 1 SOL for positive and negative values', () => {
        expect(lamportsToSol(LAMPORTS_PER_SOL)).toBe(1.0);
        expect(lamportsToSol(BigInt(LAMPORTS_PER_SOL))).toBe(1.0);
        expect(lamportsToSol(-LAMPORTS_PER_SOL)).toBe(-1.0);
        expect(lamportsToSol(BigInt(-LAMPORTS_PER_SOL))).toBe(-1.0);
    });

    it('should convert u64::MAX lamports to SOL', () => {
        expect(lamportsToSol(2n ** 64n)).toBe(18446744073.709553);
        expect(lamportsToSol(-(2n ** 64n))).toBe(-18446744073.709553);
    });
});
