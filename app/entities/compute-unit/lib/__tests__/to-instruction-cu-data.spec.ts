import type { Invocation } from '@entities/program-logs/@x/compute-unit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { toInstructionCUData } from '../to-instruction-cu-data';

beforeEach(() => vi.clearAllMocks());

const SYSTEM = '11111111111111111111111111111111';
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ED25519 = 'Ed25519SigVerify111111111111111111111111111';
const ZK_ELGAMAL_PROOF = 'ZkE1Gama1Proof11111111111111111111111111111';
const UNKNOWN_BUILTIN = 'Config1111111111111111111111111111111111111';

describe('toInstructionCUData', () => {
    describe('CU figure', () => {
        it('should take the figure from the logs', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                invocations: [mockInvocation(TOKEN, 5000)],
            });

            expect(result).toEqual([{ computeUnits: 5000, programId: TOKEN }]);
        });

        it('should prefer the figure from the logs to the fixed cost of a builtin', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM)],
                invocations: [mockInvocation(SYSTEM, 5000)],
            });

            expect(result[0].computeUnits).toBe(5000);
        });

        it('should take the fixed cost of a builtin that logged no figure', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM)],
                invocations: [mockInvocation(SYSTEM)],
            });

            expect(result[0].computeUnits).toBe(150);
        });

        it('should report 0 for a precompile', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(ED25519)],
                invocations: [],
            });

            expect(result[0].computeUnits).toBe(0);
        });

        it('should report no figure for a program with no fixed cost that logged no figure', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(UNKNOWN_BUILTIN)],
                invocations: [mockInvocation(UNKNOWN_BUILTIN)],
            });

            expect(result[0].computeUnits).toBeUndefined();
        });

        // The figures are from devnet transaction 2VdCBG9TRfSftWmRe6c5px61Fu46v2mbZqyVKBoQzJ47hPXRxqS1MhZPHoqpAaRZHT2xSBcFozS5bN2bkxBJZTDJ.
        it('should take the cost of a ZK ElGamal Proof instruction from its instruction data', () => {
            const result = toInstructionCUData({
                instructions: [
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([7, 1, 2]) },
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([0]) },
                ],
                invocations: [mockInvocation(ZK_ELGAMAL_PROOF), mockInvocation(ZK_ELGAMAL_PROOF)],
            });

            expect(result.map(r => r.computeUnits)).toEqual([200_000, 3_300]);
        });

        it('should report no figure for a ZK ElGamal Proof instruction with no known cost', () => {
            const result = toInstructionCUData({
                instructions: [
                    mockInstruction(ZK_ELGAMAL_PROOF),
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([200]) },
                ],
                invocations: [],
            });

            expect(result.map(r => r.computeUnits)).toEqual([undefined, undefined]);
        });
    });

    it('should pass through resolved instruction and program names', () => {
        const result = toInstructionCUData({
            instructions: [
                { ...mockInstruction(TOKEN), name: 'Transfer Checked', programName: 'Token Program' },
                mockInstruction(SYSTEM),
            ],
            invocations: [mockInvocation(TOKEN, 105), mockInvocation(SYSTEM, 150)],
        });

        expect(result[0]).toMatchObject({ name: 'Transfer Checked', programName: 'Token Program' });
        expect(result[1].name).toBeUndefined();
        expect(result[1].programName).toBeUndefined();
    });

    it('should return no rows for no instructions', () => {
        expect(toInstructionCUData({ instructions: [], invocations: [] })).toEqual([]);
    });

    describe('more top-level invocations than instructions', () => {
        it('should warn', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                invocations: [mockInvocation(TOKEN, 5000), mockInvocation(SYSTEM, 100)],
            });

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('misalign'), {
                instructionCount: 1,
                invocationCount: 2,
            });
        });

        // The callers run this in a render-phase `useMemo`, so a Sentry capture would repeat on every recompute.
        it('should not send the warning to Sentry', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                invocations: [mockInvocation(TOKEN, 5000), mockInvocation(SYSTEM, 100)],
            });

            expect(Logger.warn).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({ sentry: expect.anything() }),
            );
        });

        it('should not warn when the caller resolved no instructions', () => {
            toInstructionCUData({
                instructions: [],
                invocations: [mockInvocation(TOKEN, 5000), mockInvocation(SYSTEM, 100)],
            });

            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('log entries with no invoked program', () => {
        it('should keep the figures on their instructions when such an entry comes first', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(SYSTEM)],
                invocations: [mockInvocation(undefined), mockInvocation(TOKEN, 5000), mockInvocation(SYSTEM, 3000)],
            });

            expect(result.map(r => r.computeUnits)).toEqual([5000, 3000]);
        });

        it('should not warn for such an entry after the last instruction', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                invocations: [mockInvocation(TOKEN, 5000), mockInvocation(undefined)],
            });

            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });
});

function mockInstruction(programId: string) {
    return {
        programId: {
            toBase58: () => programId,
        },
    };
}

function mockInvocation(programAddress: string | undefined, computeUnits?: number): Invocation {
    return { computeUnits, entries: [], programAddress };
}
