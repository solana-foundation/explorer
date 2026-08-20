import { formatTooltipTitle, toInstructionCUDisplay } from '../instruction-display';
import type { InstructionCUData } from '../types';

describe('toInstructionCUDisplay', () => {
    describe('labels', () => {
        it('should prefix a resolved name with the position in the legend and use the bare name in the chart', () => {
            const [display] = toInstructionCUDisplay([cuData({ name: 'Transfer Checked' })]);

            expect(display.legendLabel).toBe('#1 Transfer Checked');
            expect(display.label).toBe('Transfer Checked');
        });

        // The legend keeps the position prefix and names the row; the tooltip shows one row at a time,
        // so there the position is the whole identity — "Unknown Instruction" alone would read
        // identically on every unnamed row.
        it('should name an unresolved row in the legend and identify it by position in the chart', () => {
            const display = toInstructionCUDisplay([cuData({}), cuData({}), cuData({})]);

            expect(display[2].legendLabel).toBe('#3 Unknown Instruction');
            expect(display[2].label).toBe('Instruction #3');
        });

        // Every legend row carries `#N `, named or not. An unnamed row that dropped the prefix broke the
        // shape of the list around it.
        it('should number each instruction from its own position', () => {
            const display = toInstructionCUDisplay([
                cuData({ name: 'Set Compute Unit Limit' }),
                cuData({}),
                cuData({ name: 'Route V2' }),
            ]);

            expect(display.map(d => d.legendLabel)).toEqual([
                '#1 Set Compute Unit Limit',
                '#2 Unknown Instruction',
                '#3 Route V2',
            ]);
        });
    });

    describe('CU figures', () => {
        it('should show a measured CU figure with thousands separators', () => {
            const [display] = toInstructionCUDisplay([cuData({ computeUnits: 159483 })]);

            expect(display.displayValue).toBe('159,483');
            expect(display.displayCU).toBe(159483);
        });

        it('should mark a reserved estimate with a tilde', () => {
            const [display] = toInstructionCUDisplay([cuData({ computeUnits: 0, scheduledUnits: 200000 })]);

            expect(display.displayValue).toBe('~200,000');
            expect(display.displayCU).toBe(200000);
        });

        it('should not mark a known reserved value as an estimate', () => {
            const [display] = toInstructionCUDisplay([
                cuData({ computeUnits: 0, defaultUnits: 150, scheduledUnits: 150 }),
            ]);

            expect(display.displayValue).toBe('150');
        });

        // There is no "no figure at all" case to cover: `scheduledUnits` is never 0, so the fallback
        // chain always resolves. format-instruction-logs.spec pins that at the one place that sets it.
        it('should size the bar by the same figure it displays', () => {
            const display = toInstructionCUDisplay([
                cuData({ computeUnits: 5000 }),
                cuData({ computeUnits: 0, defaultUnits: 150 }),
                cuData({ computeUnits: 0, scheduledUnits: 3000 }),
            ]);

            expect(display.map(d => d.displayCU)).toEqual([5000, 150, 3000]);
            expect(display.map(d => d.displayValue)).toEqual(['5,000', '150', '~3,000']);
        });
    });
});

describe('formatTooltipTitle', () => {
    it('should qualify the instruction name with its program', () => {
        expect(formatTooltipTitle({ label: 'Transfer Checked', programName: 'Token Program' })).toBe(
            'Token Program: Transfer Checked',
        );
    });

    it('should use the bare label when the program is unknown', () => {
        expect(formatTooltipTitle({ label: 'Instruction #1', programName: undefined })).toBe('Instruction #1');
    });

    // `toInstructionCUDisplay` always produces a label — it falls back to the position — so there is no
    // missing-label case to cover. `ExtendedBarDataset` requires the field for the same reason.
});

function cuData(overrides: Partial<InstructionCUData>): InstructionCUData {
    return { computeUnits: 1000, defaultUnits: 0, programId: 'TestProgram', scheduledUnits: 200000, ...overrides };
}
