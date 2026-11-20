import type { InstructionLogs } from '@entities/program-logs/@x/compute-unit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { formatInstructionLogs } from '../format-instruction-logs';

beforeEach(() => vi.clearAllMocks());

const SYSTEM = '11111111111111111111111111111111';
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ED25519 = 'Ed25519SigVerify111111111111111111111111111';
const ZK_ELGAMAL_PROOF = 'ZkE1Gama1Proof11111111111111111111111111111';

describe('formatInstructionLogs', () => {
    describe('CU figure', () => {
        it('should take the figure from the logs', () => {
            const result = formatInstructionLogs({
                instructionLogs: [mockInstructionLog(TOKEN, 5000)],
                instructions: [mockInstruction(TOKEN)],
            });

            expect(result).toEqual([{ computeUnits: 5000, programId: TOKEN }]);
        });

        it('should prefer the figure from the logs to the fixed cost of a builtin', () => {
            const result = formatInstructionLogs({
                instructionLogs: [mockInstructionLog(SYSTEM, 5000)],
                instructions: [mockInstruction(SYSTEM)],
            });

            expect(result[0].computeUnits).toBe(5000);
        });

        it('should take the fixed cost of a builtin that logged no figure', () => {
            const result = formatInstructionLogs({
                instructionLogs: [mockInstructionLog(SYSTEM, 0)],
                instructions: [mockInstruction(SYSTEM)],
            });

            expect(result[0].computeUnits).toBe(150);
        });

        it('should report 0 for a precompile', () => {
            const result = formatInstructionLogs({
                instructionLogs: [],
                instructions: [mockInstruction(ED25519)],
            });

            expect(result[0].computeUnits).toBe(0);
        });

        it('should report no figure for a program with no fixed cost that logged no figure', () => {
            const result = formatInstructionLogs({
                instructionLogs: [mockInstructionLog(ZK_ELGAMAL_PROOF, 0)],
                instructions: [mockInstruction(ZK_ELGAMAL_PROOF)],
            });

            expect(result[0].computeUnits).toBeUndefined();
        });
    });

    it('should pass through resolved instruction and program names', () => {
        const result = formatInstructionLogs({
            instructionLogs: [mockInstructionLog(TOKEN, 105), mockInstructionLog(SYSTEM, 150)],
            instructions: [
                { ...mockInstruction(TOKEN), name: 'Transfer Checked', programName: 'Token Program' },
                mockInstruction(SYSTEM),
            ],
        });

        expect(result[0]).toMatchObject({ name: 'Transfer Checked', programName: 'Token Program' });
        expect(result[1].name).toBeUndefined();
        expect(result[1].programName).toBeUndefined();
    });

    it('should return no rows for no instructions', () => {
        expect(formatInstructionLogs({ instructionLogs: [], instructions: [] })).toEqual([]);
    });

    describe('more top-level invocations than instructions', () => {
        it('should warn', () => {
            formatInstructionLogs({
                instructionLogs: [mockInstructionLog(TOKEN, 5000), mockInstructionLog(SYSTEM, 100)],
                instructions: [mockInstruction(TOKEN)],
            });

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('misalign'), {
                instructionCount: 1,
                invocationCount: 2,
            });
        });

        // The callers run this in a render-phase `useMemo`, so a Sentry capture would repeat on every recompute.
        it('should not send the warning to Sentry', () => {
            formatInstructionLogs({
                instructionLogs: [mockInstructionLog(TOKEN, 5000), mockInstructionLog(SYSTEM, 100)],
                instructions: [mockInstruction(TOKEN)],
            });

            expect(Logger.warn).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({ sentry: expect.anything() }),
            );
        });

        it('should not warn when the caller resolved no instructions', () => {
            formatInstructionLogs({
                instructionLogs: [mockInstructionLog(TOKEN, 5000), mockInstructionLog(SYSTEM, 100)],
                instructions: [],
            });

            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('log entries with no invoked program', () => {
        it('should keep the figures on their instructions when such an entry comes first', () => {
            const result = formatInstructionLogs({
                instructionLogs: [mockOrphanLog(), mockInstructionLog(TOKEN, 5000), mockInstructionLog(SYSTEM, 3000)],
                instructions: [mockInstruction(TOKEN), mockInstruction(SYSTEM)],
            });

            expect(result.map(r => r.computeUnits)).toEqual([5000, 3000]);
        });

        it('should not warn for such an entry after the last instruction', () => {
            formatInstructionLogs({
                instructionLogs: [mockInstructionLog(TOKEN, 5000), mockOrphanLog()],
                instructions: [mockInstruction(TOKEN)],
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

function mockInstructionLog(invokedProgram: string, computeUnits: number): InstructionLogs {
    return { computeUnits, failed: false, invokedProgram, logs: [], truncated: false };
}

function mockOrphanLog(): InstructionLogs {
    return { computeUnits: 0, failed: false, invokedProgram: null, logs: [], truncated: false };
}
