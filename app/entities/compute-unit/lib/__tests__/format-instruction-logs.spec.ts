import { Cluster } from '@utils/cluster';
import { type InstructionLogs, parseProgramLogs } from '@utils/program-logs';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), warn } }));

import { formatInstructionLogs } from '../format-instruction-logs';

afterEach(() => vi.clearAllMocks());

describe('formatInstructionLogs', () => {
    describe('positive cases: basic functionality', () => {
        it('should format single instruction with CU consumption', () => {
            const instructions = [mockInstruction('TokenProgram')];
            const instructionLogs = [mockInstructionLog(5000)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toEqual([
                {
                    computeUnits: 5000,
                    defaultUnits: 0,
                    programId: 'TokenProgram',
                    scheduledUnits: DEFAULT_RESERVED_CU,
                },
            ]);
        });

        it('should format multiple instructions with varying CU', () => {
            const instructions = [
                mockInstruction('TokenProgram'),
                mockInstruction('SystemProgram'),
                mockInstruction('MemoProgram'),
            ];
            const instructionLogs = [mockInstructionLog(5000), mockInstructionLog(150), mockInstructionLog(1000)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toHaveLength(3);
            expect(result.map(r => [r.programId, r.computeUnits])).toEqual([
                ['TokenProgram', 5000],
                ['SystemProgram', 150],
                ['MemoProgram', 1000],
            ]);
        });

        it('should pass through resolved instruction and program names', () => {
            const instructions = [
                { ...mockInstruction('TokenProgram'), name: 'Transfer Checked', programName: 'Token Program' },
                mockInstruction('SystemProgram'),
            ];
            const instructionLogs = [mockInstructionLog(105), mockInstructionLog(150)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result[0]).toMatchObject({ name: 'Transfer Checked', programName: 'Token Program' });
            // A caller that supplies no names leaves both undefined; the card falls back to the position.
            expect(result[1].name).toBeUndefined();
            expect(result[1].programName).toBeUndefined();
        });

        /**
         * The reserve is what makes `computeUnits || defaultUnits || scheduledUnits` total, so no consumer
         * needs a floor of its own. It is set unconditionally and is never 0 — pinned here because
         * `toInstructionCUDisplay` drops its fallback on the strength of it.
         */
        it('should carry a non-zero schedule reserve on every row, logged or not', () => {
            const instructions = [mockInstruction('TokenProgram'), mockInstruction('UnknownProgram')];
            const instructionLogs = [mockInstructionLog(5000), mockInstructionLog(0)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result.map(r => r.scheduledUnits)).toEqual([DEFAULT_RESERVED_CU, DEFAULT_RESERVED_CU]);
            expect(result.every(r => r.scheduledUnits > 0)).toBe(true);
        });

        it('should report 0 default units for a program that is not a builtin', () => {
            const instructions = [mockInstruction('UnknownProgram')];
            const instructionLogs = [mockInstructionLog(0)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toEqual([
                {
                    computeUnits: 0,
                    defaultUnits: 0,
                    programId: 'UnknownProgram',
                    scheduledUnits: DEFAULT_RESERVED_CU,
                },
            ]);
        });

        it('should calculate defaultUnits for known built-in programs', () => {
            const instructions = [
                mockInstruction('11111111111111111111111111111111'), // System Program
                mockInstruction('AddressLookupTab1e1111111111111111111111111'), // Address Lookup Table
                mockInstruction('Stake11111111111111111111111111111111111111'), // Stake Program
                mockInstruction('Vote111111111111111111111111111111111111111'), // Vote Program
                mockInstruction('ComputeBudget111111111111111111111111111111'), // Compute Budget
            ];
            const instructionLogs = instructions.map(() => mockInstructionLog(0));

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result.map(r => [r.programId, r.defaultUnits])).toEqual([
                ['11111111111111111111111111111111', 150],
                ['AddressLookupTab1e1111111111111111111111111', 750],
                ['Stake11111111111111111111111111111111111111', 750],
                ['Vote111111111111111111111111111111111111111', 2100],
                ['ComputeBudget111111111111111111111111111111', 150],
            ]);
        });

        // A builtin's fixed cost does not depend on whether the logs reported a figure, and the display
        // prefers `computeUnits` anyway — so it is set either way rather than only when the logs were silent.
        it('should carry a builtin default even when the logs reported a figure', () => {
            const instructions = [mockInstruction('11111111111111111111111111111111')]; // System Program
            const instructionLogs = [mockInstructionLog(5000)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result[0]).toEqual({
                computeUnits: 5000,
                defaultUnits: 150,
                programId: '11111111111111111111111111111111',
                scheduledUnits: DEFAULT_RESERVED_CU,
            });
        });
    });

    describe('negative cases: empty/missing data', () => {
        it('should handle empty instructions array', () => {
            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [],
                instructions: [],
            });

            expect(result).toEqual([]);
        });

        it('should handle empty instructionLogs array', () => {
            const instructions = [mockInstruction('TokenProgram'), mockInstruction('SystemProgram')];
            const instructionLogs: InstructionLogs[] = [];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toEqual([
                {
                    computeUnits: 0,
                    defaultUnits: 0,
                    programId: 'TokenProgram',
                    scheduledUnits: DEFAULT_RESERVED_CU,
                },
                {
                    computeUnits: 0,
                    defaultUnits: 0,
                    programId: 'SystemProgram',
                    scheduledUnits: DEFAULT_RESERVED_CU,
                },
            ]);
        });

        it('should handle instructionLogs shorter than instructions', () => {
            const instructions = [
                mockInstruction('TokenProgram'),
                mockInstruction('SystemProgram'),
                mockInstruction('MemoProgram'),
            ];
            const instructionLogs = [
                mockInstructionLog(5000),
                // Missing logs for instruction 2 and 3 (e.g., tx failed)
            ];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toHaveLength(3);
            expect(result.map(r => r.computeUnits)).toEqual([5000, 0, 0]);
        });

        it('should handle transaction with mix of successful and failed instructions', () => {
            const instructions = [
                mockInstruction('TokenProgram'),
                mockInstruction('SystemProgram'),
                mockInstruction('UnknownProgram'), // failed
            ];
            const instructionLogs = [
                mockInstructionLog(5000),
                mockInstructionLog(0), // System program used minimum
                // No log for third instruction (it failed before logging)
            ];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result.map(r => [r.programId, r.computeUnits])).toEqual([
                ['TokenProgram', 5000],
                ['SystemProgram', 0],
                ['UnknownProgram', 0],
            ]);
        });
    });

    /**
     * Row `i` is paired with the `i`th top-level invocation, so the two lists must line up. Only one
     * direction is a defect: a top-level invocation is logged for every instruction that executed, so
     * fewer than the instruction count is the ordinary shape of a failed transaction (covered above),
     * while more means the caller filtered or reordered rows and every later figure lands on the wrong
     * instruction.
     */
    describe('index alignment with the logs', () => {
        it('should report more top-level invocations than instructions', () => {
            formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockInstructionLog(5000), mockInstructionLog(100)],
                instructions: [mockInstruction('TokenProgram')],
            });

            expect(warn).toHaveBeenCalledWith(expect.stringContaining('misalign'), {
                instructionCount: 1,
                invocationCount: 2,
            });
        });

        // Pinned because this runs in the callers' render-phase `useMemo`: a Sentry capture would re-fire
        // on every recompute, so the counts stay console-only context rather than `sentryExtras`.
        it('should not send the report to Sentry', () => {
            formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockInstructionLog(5000), mockInstructionLog(100)],
                instructions: [mockInstruction('TokenProgram')],
            });

            expect(warn).toHaveBeenCalledWith(
                expect.any(String),
                expect.not.objectContaining({ sentry: expect.anything() }),
            );
        });

        it('should stay silent when a failed transaction logs fewer instructions than it carries', () => {
            formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockInstructionLog(5000)],
                instructions: [mockInstruction('TokenProgram'), mockInstruction('SystemProgram')],
            });

            expect(warn).not.toHaveBeenCalled();
        });

        // A different failure, and one the caller already reports itself.
        it('should stay silent when the caller resolved no instructions', () => {
            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockInstructionLog(5000), mockInstructionLog(100)],
                instructions: [],
            });

            expect(result).toEqual([]);
            expect(warn).not.toHaveBeenCalled();
        });
    });

    /**
     * `parseProgramLogs` opens an entry with no `invokedProgram` for a log line that arrives while no
     * invocation is in progress, and for a runtime error that produced no logs at all. Neither stands for
     * an instruction, so pairing them by raw index shifts every later CU figure onto the wrong row.
     */
    describe('log entries that belong to no instruction', () => {
        it('should keep the figures aligned when an orphan entry precedes the real ones', () => {
            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockOrphanLog(), mockInstructionLog(5000), mockInstructionLog(3000)],
                instructions: [mockInstruction('TokenProgram'), mockInstruction('MemoProgram')],
            });

            expect(result.map(r => [r.programId, r.computeUnits])).toEqual([
                ['TokenProgram', 5000],
                ['MemoProgram', 3000],
            ]);
        });

        it('should not report misalignment for a trailing orphan entry', () => {
            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockInstructionLog(5000), mockOrphanLog()],
                instructions: [mockInstruction('TokenProgram')],
            });

            expect(result.map(r => r.computeUnits)).toEqual([5000]);
            expect(warn).not.toHaveBeenCalled();
        });

        // The runtime-error entry parseProgramLogs synthesises when a simulation failed without logging.
        it('should leave every row unlogged when the only entry is an orphan', () => {
            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: [mockOrphanLog()],
                instructions: [mockInstruction('TokenProgram'), mockInstruction('MemoProgram')],
            });

            expect(result.map(r => r.computeUnits)).toEqual([0, 0]);
            expect(warn).not.toHaveBeenCalled();
        });
    });

    /**
     * Against the real producer, because the defect was a mismatch between what `parseProgramLogs`
     * returns and what this module assumed it returns — hand-built entries cannot catch that drifting.
     */
    describe('paired with parseProgramLogs output', () => {
        const SYSTEM = '11111111111111111111111111111111';
        const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

        const format = (logs: string[], programIds: string[]) =>
            formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs: parseProgramLogs(logs, null, Cluster.MainnetBeta),
                instructions: programIds.map(mockInstruction),
            });

        it('should pair a well-formed transaction row for row', () => {
            const result = format(
                [
                    `Program ${SYSTEM} invoke [1]`,
                    `Program ${SYSTEM} success`,
                    `Program ${TOKEN} invoke [1]`,
                    `Program ${TOKEN} consumed 105 of 2408 compute units`,
                    `Program ${TOKEN} success`,
                ],
                [SYSTEM, TOKEN],
            );

            expect(result.map(r => r.computeUnits)).toEqual([0, 105]);
            expect(warn).not.toHaveBeenCalled();
        });

        // A runtime line with no invocation in progress opens an entry of its own. Pairing by raw index
        // put it on the first instruction and shifted every real figure one row down.
        it('should not shift figures when a runtime line precedes the invocations', () => {
            const result = format(
                [
                    'Transfer: insufficient lamports 100, need 200',
                    `Program ${SYSTEM} success`,
                    `Program ${SYSTEM} invoke [1]`,
                    `Program ${SYSTEM} consumed 5000 of 200000 compute units`,
                    `Program ${SYSTEM} success`,
                    `Program ${TOKEN} invoke [1]`,
                    `Program ${TOKEN} consumed 3000 of 195000 compute units`,
                    `Program ${TOKEN} success`,
                ],
                [SYSTEM, TOKEN],
            );

            expect(result.map(r => r.computeUnits)).toEqual([5000, 3000]);
        });

        it('should not report misalignment for a trailing runtime line', () => {
            format(
                [`Program ${SYSTEM} invoke [1]`, `Program ${SYSTEM} success`, 'Some trailing runtime line'],
                [SYSTEM],
            );

            expect(warn).not.toHaveBeenCalled();
        });
    });
});

const DEFAULT_RESERVED_CU = 200_000;

function mockInstruction(programId: string) {
    return {
        programId: {
            toBase58: () => programId,
        },
    };
}

function mockInstructionLog(computeUnits: number, invokedProgram = 'TestProgram'): InstructionLogs {
    return {
        computeUnits,
        failed: false,
        invokedProgram,
        logs: [],
        truncated: false,
    };
}

/** An entry parseProgramLogs opened for a log line no top-level invocation accounts for. */
function mockOrphanLog(computeUnits = 0): InstructionLogs {
    return { computeUnits, failed: false, invokedProgram: null, logs: [], truncated: false };
}
