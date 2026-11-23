import type { InstructionComputeUnits, InstructionCUData } from './types';

/**
 * One chart row, with every string it renders already derived. `name` is dropped so a consumer reads
 * `label` or `legendLabel` and cannot bypass the positional fallback those apply.
 */
export type InstructionCUDisplay = Omit<InstructionCUData, 'name'> & {
    // The CU figure the bar is sized by. 0 when `computeUnits` is not a figure, so the row has no segment.
    displayCU: number;
    // Chart tooltip title, before the program qualifier.
    label: string;
    // Legend entry: the instruction's position, then its name — `Unknown Instruction` when nothing
    // resolved one, so every row in the list reads the same shape.
    legendLabel: string;
    // The CU figure as shown, `Not executed`, or `Unknown`.
    displayValue: string;
};

/**
 * The per-instruction labels and CU figures the chart displays, derived from the CU data alone. Pure,
 * so the labelling is testable without rendering a chart.
 */
export function toInstructionCUDisplay(instructions: InstructionCUData[]): InstructionCUDisplay[] {
    return instructions.map((item, i) => {
        return {
            ...item,
            displayCU: typeof item.computeUnits === 'number' ? item.computeUnits : 0,
            displayValue: toDisplayValue(item.computeUnits),
            // The tooltip shows one row at a time, so an unnamed instruction is identified by its
            // position alone — `Unknown Instruction` there would read the same on every unnamed row.
            label: item.name ?? positionLabel(i),
            // The legend shows every row at once, so all of them carry the position prefix. An unnamed
            // row names itself instead of dropping out of the shape the rows around it follow.
            legendLabel: `#${i + 1} ${item.name ?? UNKNOWN_INSTRUCTION_LABEL}`,
        };
    });
}

/**
 * The chart tooltip's title: the instruction name qualified by its program, when the program is known.
 * The legend omits the program qualifier and prefixes the position instead, to fit the card width.
 */
export function formatTooltipTitle({ label, programName }: { label: string; programName?: string }): string {
    return programName ? `${programName}: ${label}` : label;
}

// Kept in step with the sentinel the summary builders substitute for history rows, so one
// instruction reads the same wherever it appears. Declared here rather than imported: this entity owns
// its own fallback by design — see "Two row shapes" in the transaction-data README.
const UNKNOWN_INSTRUCTION_LABEL = 'Unknown Instruction';

function toDisplayValue(computeUnits: InstructionComputeUnits): string {
    if (computeUnits === undefined) return 'Unknown';
    if (computeUnits === 'not-executed') return 'Not executed';

    return computeUnits.toLocaleString();
}

function positionLabel(index: number): string {
    return `Instruction #${index + 1}`;
}
