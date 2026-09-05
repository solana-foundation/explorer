import { render, screen } from '@testing-library/react';
import type { ChartData, ChartOptions } from 'chart.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InstructionCUData } from '../../lib/types';

// Chart.js needs a real canvas, which jsdom does not have. Stubbing <Bar> keeps this spec on the parts
// that are plain DOM — the legend — while still capturing the dataset the chart would have drawn, which
// is where the tooltip reads its labels from.
const { Bar } = vi.hoisted(() => ({ Bar: vi.fn((_props: unknown) => null) }));
vi.mock('react-chartjs-2', () => ({ Bar }));

import { BaseCUProfilingCard } from '../BaseCUProfilingCard';

beforeEach(() => vi.clearAllMocks());

describe('BaseCUProfilingCard', () => {
    describe('legend', () => {
        it('should label each instruction with its resolved name', () => {
            render(<BaseCUProfilingCard instructions={transferAndComputeBudget()} unitsConsumed={405} />);

            expect(screen.getByText('#1 Transfer Checked: 105')).toBeInTheDocument();
            expect(screen.getByText('#2 Set Compute Unit Price: 150')).toBeInTheDocument();
        });

        it('should fall back to the position for an instruction nothing named', () => {
            render(
                <BaseCUProfilingCard
                    instructions={[
                        cuData({ computeUnits: 105, name: 'Transfer Checked' }),
                        cuData({ computeUnits: 150 }),
                    ]}
                />,
            );

            expect(screen.getByText('#1 Transfer Checked: 105')).toBeInTheDocument();
            expect(screen.getByText('#2 Unknown Instruction: 150')).toBeInTheDocument();
        });

        // The legend truncates long names with CSS, so the full text has to stay reachable on hover.
        it('should expose the untruncated label and CU figure as a title attribute', () => {
            render(<BaseCUProfilingCard instructions={[cuData({ computeUnits: 159483, name: 'Route V2' })]} />);

            expect(screen.getByText('#1 Route V2: 159,483')).toHaveAttribute('title', '#1 Route V2: 159,483');
        });

        // The total interpolates the figure between static text, so it spans several text nodes.
        it('should show the total when one is given', () => {
            const { container } = render(
                <BaseCUProfilingCard instructions={transferAndComputeBudget()} unitsConsumed={405} />,
            );

            expect(container.textContent).toContain('Total: 405 CU');
        });
    });

    describe('chart dataset', () => {
        // The tooltip reads its title from the dataset's `label` and `programName`, so those must carry
        // the resolved names rather than the positional fallback.
        it('should carry the resolved instruction and program names per dataset', () => {
            render(<BaseCUProfilingCard instructions={transferAndComputeBudget()} />);

            expect(datasets().map(d => [d.label, (d as { programName?: string }).programName])).toEqual([
                ['Transfer Checked', 'Token Program'],
                ['Set Compute Unit Price', 'Compute Budget Program'],
            ]);
        });

        it('should carry the positional label when nothing named the instruction', () => {
            render(<BaseCUProfilingCard instructions={[cuData({ computeUnits: 150 })]} />);

            expect(datasets()[0].label).toBe('Instruction #1');
        });
    });

    /**
     * The tooltip builds its shell with innerHTML, so the one thing that must never be interpolated is
     * the instruction name — it can come from program-authored on-chain IDL metadata, which makes it
     * attacker-controlled by anyone who can publish an IDL.
     */
    describe('tooltip', () => {
        it('should write a program-authored name as text, not as markup', () => {
            const name = '<img src=x onerror="alert(1)">';
            render(<BaseCUProfilingCard instructions={[cuData({ computeUnits: 105, name })]} />);

            const { tooltip, htmlWrites } = showTooltip();

            // Asserting on the assigned markup, not on the resulting DOM: an <img onerror> fires while
            // innerHTML parses it, so overwriting the node afterwards with textContent would hide the
            // injection from any check made after the fact.
            expect(htmlWrites.some(html => html.includes(name))).toBe(false);
            expect(textOf(tooltip, '.cu-tooltip-title')).toBe(name);
            expect(textOf(tooltip, 'img')).toBeUndefined();
        });

        it('should show the same CU figure the legend shows', () => {
            render(<BaseCUProfilingCard instructions={[cuData({ computeUnits: 0, scheduledUnits: 200000 })]} />);

            expect(textOf(showTooltip().tooltip, '.cu-tooltip-cu')).toBe('~200,000 CU reserved');
        });

        it('should qualify the instruction name with its program', () => {
            render(<BaseCUProfilingCard instructions={transferAndComputeBudget()} />);

            expect(textOf(showTooltip().tooltip, '.cu-tooltip-title')).toBe('Token Program: Transfer Checked');
        });

        // Chart.js signals mouse-out by re-invoking the handler with opacity 0. Without this the tooltip
        // would stay pinned open showing the last instruction's figures.
        it('should hide the tooltip when the pointer leaves the bar', () => {
            render(<BaseCUProfilingCard instructions={transferAndComputeBudget()} />);
            expect(showTooltip().tooltip.style.opacity).toBe('1');

            expect(showTooltip(0).tooltip.style.opacity).toBe('0');
        });
    });

    describe('negative cases', () => {
        it('should render nothing without instructions', () => {
            const { container } = render(<BaseCUProfilingCard instructions={[]} />);

            expect(container).toBeEmptyDOMElement();
        });
    });
});

function datasets(): ChartData<'bar'>['datasets'] {
    const props = Bar.mock.calls.at(-1)?.[0] as { data: ChartData<'bar'> } | undefined;
    if (!props) throw new Error('BaseCUProfilingCard rendered no chart');
    return props.data.datasets;
}

/**
 * Drive the chart's external tooltip handler for the first dataset. Chart.js owns this callback, so
 * invoking it directly is the only way to reach the tooltip markup without a canvas. Returns the
 * element it wrote into, plus every string assigned to an innerHTML while it ran.
 */
function showTooltip(opacity = 1): { tooltip: HTMLElement; htmlWrites: string[] } {
    const props = Bar.mock.calls.at(-1)?.[0] as { data: ChartData<'bar'>; options: ChartOptions<'bar'> } | undefined;
    if (!props) throw new Error('BaseCUProfilingCard rendered no chart');

    const external = props.options.plugins?.tooltip?.external;
    if (!external) throw new Error('Chart options carry no external tooltip handler');

    // Chart.js types `external` with a TooltipModel `this`, which it never reads. Drop it rather than
    // fabricate a whole model just to satisfy the call.
    const invoke = external as unknown as (args: { tooltip: unknown }) => void;
    const dataset = props.data.datasets[0];
    const htmlWrites = recordInnerHtmlWrites(() =>
        invoke({ tooltip: { body: [{}], dataPoints: [{ dataset }], opacity } }),
    );

    // eslint-disable-next-line testing-library/no-node-access -- imperative Chart.js DOM, not a render
    const tooltip = document.getElementById('cu-chartjs-tooltip');
    if (!tooltip) throw new Error('External tooltip handler created no element');
    return { htmlWrites, tooltip };
}

/**
 * The text of one node inside the tooltip, or undefined when there is no such node. Chart.js builds
 * this subtree imperatively outside the React tree, so Testing Library's queries do not reach it.
 */
function textOf(tooltip: HTMLElement, selector: string): string | undefined {
    return tooltip.querySelector(selector)?.textContent ?? undefined;
}

/**
 * Every string assigned to an `innerHTML` while `run` executes. Patched on `Element.prototype` because
 * the handler creates the element it writes into, so there is no instance to patch beforehand. The
 * `finally` restores the original descriptor, which is what keeps the patch from leaking into any test
 * that runs after this one.
 */
function recordInnerHtmlWrites(run: () => void): string[] {
    const writes: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (!descriptor?.get || !descriptor.set) throw new Error('innerHTML is not an accessor on Element.prototype');

    const { get, set } = descriptor;
    Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        get,
        set(this: Element, value: string) {
            writes.push(value);
            set.call(this, value);
        },
    });
    try {
        run();
    } finally {
        Object.defineProperty(Element.prototype, 'innerHTML', descriptor);
    }
    return writes;
}

function cuData(overrides: Partial<InstructionCUData>): InstructionCUData {
    return { computeUnits: 1000, defaultUnits: 0, programId: 'TestProgram', scheduledUnits: 200000, ...overrides };
}

function transferAndComputeBudget(): InstructionCUData[] {
    return [
        cuData({ computeUnits: 105, name: 'Transfer Checked', programName: 'Token Program' }),
        cuData({ computeUnits: 150, name: 'Set Compute Unit Price', programName: 'Compute Budget Program' }),
    ];
}
