import type { InstructionCUData } from './types';

/**
 * One chart row, with every string it renders already derived. `name` is dropped so a consumer reads
 * `label` or `legendLabel` and cannot bypass the positional fallback those apply.
 */
export type InstructionCUDisplay = Omit<InstructionCUData, 'name'> & {
    // The CU figure the bar is sized by. Falls back `computeUnits` → `defaultUnits` → `scheduledUnits`,
    // the last of which is never 0, so an instruction the logs said nothing about still occupies a
    // visible segment.
    displayCU: number;
    // Chart tooltip title, before the program qualifier.
    label: string;
    // Legend entry, which prefixes a resolved name with the instruction's position.
    legendLabel: string;
    // The CU figure as shown, with a ~ prefix when it is the schedule's estimate.
    displayValue: string;
    // True only for the schedule's reserve (`scheduledUnits`) — the one figure that is a guess. A
    // measured `computeUnits` and a builtin's fixed `defaultUnits` are both real costs, so the tooltip
    // presents neither as an estimate.
    isEstimate: boolean;
};

/**
 * The per-instruction labels and CU figures the chart displays, derived from the CU data alone. Pure,
 * so the labelling is testable without rendering a chart.
 */
export function toInstructionCUDisplay(instructions: InstructionCUData[]): InstructionCUDisplay[] {
    return instructions.map((item, i) => {
        // `scheduledUnits` is never 0, so this resolves to a real figure on every row — see types.ts.
        const value = item.computeUnits || item.defaultUnits || item.scheduledUnits;
        const isEstimate = !item.computeUnits && !item.defaultUnits;

        return {
            ...item,
            displayCU: value,
            displayValue: `${isEstimate ? '~' : ''}${value.toLocaleString()}`,
            isEstimate,
            // Without a resolved name the position is the instruction's only identity, so it becomes
            // the whole label instead of a prefix.
            label: item.name ?? positionLabel(i),
            legendLabel: item.name ? `#${i + 1} ${item.name}` : positionLabel(i),
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

function positionLabel(index: number): string {
    return `Instruction #${index + 1}`;
}
