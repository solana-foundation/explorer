import { cuData } from '../../__fixtures__/cu-data';
import { formatTooltipTitle, toInstructionCUDisplay } from '../instruction-display';

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

        it('should show 0 for an instruction that consumed nothing', () => {
            const [display] = toInstructionCUDisplay([cuData({ computeUnits: 0 })]);

            expect(display.displayValue).toBe('0');
            expect(display.displayCU).toBe(0);
        });

        it('should show Unknown and size no bar for an instruction with no figure', () => {
            const [display] = toInstructionCUDisplay([cuData({ computeUnits: undefined })]);

            expect(display.displayValue).toBe('Unknown');
            expect(display.displayCU).toBe(0);
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
