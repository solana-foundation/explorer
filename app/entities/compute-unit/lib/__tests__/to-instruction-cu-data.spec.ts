import type { Invocation, ParsedProgramLogs } from '@entities/program-logs/@x/compute-unit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { toInstructionCUData } from '../to-instruction-cu-data';
import type { TransactionOutcome } from '../types';

beforeEach(() => vi.clearAllMocks());

const SYSTEM = '11111111111111111111111111111111';
const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ED25519 = 'Ed25519SigVerify111111111111111111111111111';
const ZK_ELGAMAL_PROOF = 'ZkE1Gama1Proof11111111111111111111111111111';
const STAKE = 'Stake11111111111111111111111111111111111111';
const ADDRESS_LOOKUP_TABLE = 'AddressLookupTab1e1111111111111111111111111';
const UNKNOWN_BUILTIN = 'Config1111111111111111111111111111111111111';
const SUCCEEDED: TransactionOutcome = { status: 'succeeded' };

describe('toInstructionCUData', () => {
    describe('an instruction whose invocation logged a figure', () => {
        it('should take the figure from the logs', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                logs: completeLogs(endedInvocation(TOKEN, 5000)),
                outcome: SUCCEEDED,
            });

            expect(result).toEqual([{ computeUnits: 5000, programId: TOKEN }]);
        });

        it('should prefer the figure from the logs to the fixed cost of the program', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(STAKE)],
                logs: completeLogs(endedInvocation(STAKE, 9327)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBe(9327);
        });
    });

    describe('an instruction whose invocation ended with no figure', () => {
        it('should take the fixed cost of a builtin', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM)],
                logs: completeLogs(endedInvocation(SYSTEM)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBe(150);
        });

        it('should take the fixed cost of a builtin from before a feature gate moved it on chain', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(STAKE)],
                logs: completeLogs(endedInvocation(STAKE)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBe(750);
        });

        it.each([
            ['BPFLoader1111111111111111111111111111111111', 1140],
            ['BPFLoader2111111111111111111111111111111111', 570],
            ['BPFLoaderUpgradeab1e11111111111111111111111', 2370],
        ])('should take the fixed cost of loader %s', (loader, cost) => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(loader)],
                logs: completeLogs(endedInvocation(loader)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBe(cost);
        });

        it('should take the fixed cost of a builtin whose invocation failed', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM)],
                logs: completeLogs(failedInvocation(SYSTEM)),
                outcome: failedAt(0),
            });

            expect(result[0].computeUnits).toBe(150);
        });

        it('should take the fixed cost of a builtin that logged no invoke line', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(ADDRESS_LOOKUP_TABLE)],
                logs: completeLogs(linesWithNoInvoke()),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBe(750);
        });

        it('should take the cost of a ZK ElGamal Proof instruction from its instruction data', () => {
            const result = toInstructionCUData({
                instructions: [
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([7, 1, 2]) },
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([0]) },
                ],
                logs: completeLogs(endedInvocation(ZK_ELGAMAL_PROOF), endedInvocation(ZK_ELGAMAL_PROOF)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([200_000, 3_300]);
        });

        it('should report no figure for a ZK ElGamal Proof instruction with no known cost', () => {
            const result = toInstructionCUData({
                instructions: [
                    mockInstruction(ZK_ELGAMAL_PROOF),
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([200]) },
                ],
                logs: completeLogs(endedInvocation(ZK_ELGAMAL_PROOF), endedInvocation(ZK_ELGAMAL_PROOF)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([undefined, undefined]);
        });

        it('should report no figure for a program with no fixed cost', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(UNKNOWN_BUILTIN)],
                logs: completeLogs(endedInvocation(UNKNOWN_BUILTIN)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBeUndefined();
        });
    });

    describe('complete logs with no invocation for an instruction', () => {
        it('should take the fixed cost of a builtin, also of one that a feature gate moved on chain', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM), mockInstruction(STAKE)],
                logs: completeLogs(),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([150, 750]);
        });
    });

    describe('truncated logs', () => {
        it('should take the fixed cost of a builtin that no feature gate moves on chain', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(SYSTEM)],
                logs: truncatedLogs(endedInvocation(TOKEN, 1200)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([1200, 150]);
        });

        it('should take the fixed cost of such a builtin when it is the instruction that failed', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM)],
                logs: truncatedLogs(failedInvocation(SYSTEM)),
                outcome: failedAt(0),
            });

            expect(result[0].computeUnits).toBe(150);
        });

        it('should report no figure for a builtin that a feature gate moved on chain', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(STAKE)],
                logs: truncatedLogs(endedInvocation(TOKEN, 1200)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([1200, undefined]);
        });

        it('should report no figure for a moved builtin whose invocation kept its status line and lost its figure', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(STAKE)],
                logs: truncatedLogs(endedInvocation(STAKE)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBeUndefined();
        });

        it('should report no figure for a ZK ElGamal Proof instruction', () => {
            const result = toInstructionCUData({
                instructions: [{ ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([7]) }],
                logs: truncatedLogs(endedInvocation(ZK_ELGAMAL_PROOF)),
                outcome: SUCCEEDED,
            });

            expect(result[0].computeUnits).toBeUndefined();
        });
    });

    describe('a failed transaction', () => {
        it('should report each instruction after the one that failed as not executed', () => {
            const result = toInstructionCUData({
                instructions: [
                    mockInstruction(TOKEN),
                    mockInstruction(SYSTEM),
                    { ...mockInstruction(ZK_ELGAMAL_PROOF), data: new Uint8Array([7]) },
                ],
                logs: completeLogs(failedInvocation(TOKEN, 1200)),
                outcome: failedAt(0),
            });

            expect(result.map(r => r.computeUnits)).toEqual([1200, 'not-executed', 'not-executed']);
        });

        it('should take the fixed cost of a builtin before the one that failed, and no figure for the one that failed', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(SYSTEM), mockInstruction(SYSTEM)],
                logs: completeLogs(),
                outcome: failedAt(1),
            });

            expect(result.map(r => r.computeUnits)).toEqual([150, undefined]);
        });

        it('should report no figure for a builtin with no invocation when the error names no instruction', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(SYSTEM)],
                logs: completeLogs(endedInvocation(TOKEN, 1200)),
                outcome: failedAt(undefined),
            });

            expect(result.map(r => r.computeUnits)).toEqual([1200, undefined]);
        });
    });

    describe('a precompile', () => {
        it('should report 0 and keep the next figure on its instruction', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(ED25519), mockInstruction(TOKEN)],
                logs: completeLogs(endedInvocation(TOKEN, 5000)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([0, 5000]);
        });

        it('should report 0 after the instruction that failed', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(ED25519)],
                logs: completeLogs(failedInvocation(TOKEN, 1200)),
                outcome: failedAt(0),
            });

            expect(result.map(r => r.computeUnits)).toEqual([1200, 0]);
        });
    });

    it('should pass through resolved instruction and program names', () => {
        const result = toInstructionCUData({
            instructions: [
                { ...mockInstruction(TOKEN), name: 'Transfer Checked', programName: 'Token Program' },
                mockInstruction(SYSTEM),
            ],
            logs: completeLogs(endedInvocation(TOKEN, 105), endedInvocation(SYSTEM, 150)),
            outcome: SUCCEEDED,
        });

        expect(result[0]).toMatchObject({ name: 'Transfer Checked', programName: 'Token Program' });
        expect(result[1].name).toBeUndefined();
        expect(result[1].programName).toBeUndefined();
    });

    it('should return no rows for no instructions', () => {
        expect(toInstructionCUData({ instructions: [], logs: completeLogs(), outcome: SUCCEEDED })).toEqual([]);
    });

    describe('more top-level invocations than instructions', () => {
        it('should warn', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                logs: completeLogs(endedInvocation(TOKEN, 5000), endedInvocation(SYSTEM, 100)),
                outcome: SUCCEEDED,
            });

            expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('misalign'), {
                instructionCount: 1,
                invocationCount: 2,
            });
        });

        it('should not send the warning to Sentry', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                logs: completeLogs(endedInvocation(TOKEN, 5000), endedInvocation(SYSTEM, 100)),
                outcome: SUCCEEDED,
            });

            expect(Logger.warn).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({ sentry: expect.anything() }),
            );
        });

        it('should not warn when the caller resolved no instructions', () => {
            toInstructionCUData({
                instructions: [],
                logs: completeLogs(endedInvocation(TOKEN, 5000), endedInvocation(SYSTEM, 100)),
                outcome: SUCCEEDED,
            });

            expect(Logger.warn).not.toHaveBeenCalled();
        });
    });

    describe('log entries with no invoked program', () => {
        it('should keep the figures on their instructions when such an entry comes first', () => {
            const result = toInstructionCUData({
                instructions: [mockInstruction(TOKEN), mockInstruction(SYSTEM)],
                logs: completeLogs(linesWithNoInvoke(), endedInvocation(TOKEN, 5000), endedInvocation(SYSTEM, 3000)),
                outcome: SUCCEEDED,
            });

            expect(result.map(r => r.computeUnits)).toEqual([5000, 3000]);
        });

        it('should not warn for such an entry after the last instruction', () => {
            toInstructionCUData({
                instructions: [mockInstruction(TOKEN)],
                logs: completeLogs(endedInvocation(TOKEN, 5000), linesWithNoInvoke()),
                outcome: SUCCEEDED,
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

function endedInvocation(programAddress: string, computeUnits?: number): Invocation {
    return { computeUnits, entries: [{ kind: 'success' }], programAddress };
}

function failedInvocation(programAddress: string, computeUnits?: number): Invocation {
    return { computeUnits, entries: [{ kind: 'failed', text: 'custom program error: 0x1' }], programAddress };
}

function linesWithNoInvoke(): Invocation {
    return { computeUnits: undefined, entries: [{ kind: 'text', text: 'Create Account' }], programAddress: undefined };
}

function completeLogs(...invocations: Invocation[]): ParsedProgramLogs {
    return { invocations, truncated: false };
}

function truncatedLogs(...invocations: Invocation[]): ParsedProgramLogs {
    return { invocations, truncated: true };
}

function failedAt(failedInstructionIndex: number | undefined): TransactionOutcome {
    return { failedInstructionIndex, status: 'failed' };
}
