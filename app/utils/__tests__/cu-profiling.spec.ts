import { Cluster } from '../cluster';
import { formatInstructionLogs } from '../cu-profiling';
import { InstructionLogs } from '../program-logs';

const DEFAULT_RESERVED_CU = 200_000;

// create mock instruction with programId
function mockInstruction(programId: string) {
    return {
        programId: {
            toBase58: () => programId,
        },
    };
}

// mock instruction logs
function mockInstructionLog(computeUnits: number, invokedProgram = 'TestProgram'): InstructionLogs {
    return {
        computeUnits,
        failed: false,
        invokedProgram,
        logs: [],
        truncated: false,
    };
}

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
                    minValue: 150,
                    programId: 'TokenProgram',
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
            expect(result[0]).toEqual({ computeUnits: 5000, minValue: 150, programId: 'TokenProgram' });
            expect(result[1]).toEqual({ computeUnits: 150, minValue: 150, programId: 'SystemProgram' });
            expect(result[2]).toEqual({ computeUnits: 1000, minValue: 150, programId: 'MemoProgram' });
        });

        it('should add displayUnits for instructions with 0 CU', () => {
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
                    displayUnits: DEFAULT_RESERVED_CU,
                    minValue: 150,
                    programId: 'UnknownProgram',
                    reservedValue: 0,
                },
            ]);
        });

        it('should not add displayUnits for instructions with non-zero CU', () => {
            const instructions = [mockInstruction('TokenProgram')];
            const instructionLogs = [mockInstructionLog(5000)];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result[0]).not.toHaveProperty('displayUnits');
        });

        it('should calculate reservedValue for known built-in programs with 0 CU', () => {
            const instructions = [
                mockInstruction('11111111111111111111111111111111'), // System Program
                mockInstruction('AddressLookupTab1e1111111111111111111111111'), // Address Lookup Table
                mockInstruction('Stake11111111111111111111111111111111111111'), // Stake Program
                mockInstruction('Vote111111111111111111111111111111111111111'), // Vote Program
                mockInstruction('ComputeBudget111111111111111111111111111111'), // Compute Budget
            ];
            const instructionLogs = [
                mockInstructionLog(0),
                mockInstructionLog(0),
                mockInstructionLog(0),
                mockInstructionLog(0),
                mockInstructionLog(0),
            ];

            const result = formatInstructionLogs({
                cluster: Cluster.MainnetBeta,
                epoch: 0n,
                instructionLogs,
                instructions,
            });

            expect(result).toHaveLength(5);
            // System Program
            expect(result[0]).toMatchObject({
                computeUnits: 0,
                minValue: 150,
                programId: '11111111111111111111111111111111',
                reservedValue: 150,
            });
            // Address Lookup Table
            expect(result[1]).toMatchObject({
                computeUnits: 0,
                minValue: 150,
                programId: 'AddressLookupTab1e1111111111111111111111111',
                reservedValue: 750,
            });
            // Stake Program
            expect(result[2]).toMatchObject({
                computeUnits: 0,
                minValue: 150,
                programId: 'Stake11111111111111111111111111111111111111',
                reservedValue: 750,
            });
            // Vote Program
            expect(result[3]).toMatchObject({
                computeUnits: 0,
                minValue: 150,
                programId: 'Vote111111111111111111111111111111111111111',
                reservedValue: 2100,
            });
            // Compute Budget
            expect(result[4]).toMatchObject({
                computeUnits: 0,
                minValue: 150,
                programId: 'ComputeBudget111111111111111111111111111111',
                reservedValue: 150,
            });
        });

        it('should not add reservedValue for instructions with non-zero CU', () => {
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
                minValue: 150,
                programId: '11111111111111111111111111111111',
            });
            expect(result[0]).not.toHaveProperty('reservedValue');
            expect(result[0]).not.toHaveProperty('displayUnits');
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
                    displayUnits: DEFAULT_RESERVED_CU,
                    minValue: 150,
                    programId: 'TokenProgram',
                    reservedValue: 0,
                },
                {
                    computeUnits: 0,
                    displayUnits: DEFAULT_RESERVED_CU,
                    minValue: 150,
                    programId: 'SystemProgram',
                    reservedValue: 0,
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
            expect(result[0]).toEqual({ computeUnits: 5000, minValue: 150, programId: 'TokenProgram' });
            expect(result[1]).toEqual({
                computeUnits: 0,
                displayUnits: DEFAULT_RESERVED_CU,
                minValue: 150,
                programId: 'SystemProgram',
                reservedValue: 0,
            });
            expect(result[2]).toEqual({
                computeUnits: 0,
                displayUnits: DEFAULT_RESERVED_CU,
                minValue: 150,
                programId: 'MemoProgram',
                reservedValue: 0,
            });
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

            expect(result).toEqual([
                { computeUnits: 5000, minValue: 150, programId: 'TokenProgram' },
                {
                    computeUnits: 0,
                    displayUnits: DEFAULT_RESERVED_CU,
                    minValue: 150,
                    programId: 'SystemProgram',
                    reservedValue: 0,
                },
                {
                    computeUnits: 0,
                    displayUnits: DEFAULT_RESERVED_CU,
                    minValue: 150,
                    programId: 'UnknownProgram',
                    reservedValue: 0,
                },
            ]);
        });
    });
});
