import { ClusterStatsStatus } from '@providers/stats/solanaClusterStats';
import { render } from '@testing-library/react';
import type { ChartOptions } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';

const { Bar } = vi.hoisted(() => ({ Bar: vi.fn((_props: unknown) => null) }));
vi.mock('react-chartjs-2', () => ({ Bar }));
vi.mock('@providers/stats/solanaClusterStats', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/stats/solanaClusterStats')>()),
    usePerformanceInfo: () => ({
        avgTps: 1000,
        historyMaxTps: 2000,
        perfHistory: { long: [], medium: [], short: [] },
        status: ClusterStatsStatus.Ready,
        transactionCount: 0n,
    }),
}));

import { LiveTransactionStatsCard } from '../LiveTransactionStatsCard';

describe('LiveTransactionStatsCard', () => {
    it('should show the TPS of the hovered bar and its age', () => {
        render(<LiveTransactionStatsCard />);

        const tooltip = showTooltip({ dataIndex: 27, raw: 1234 });

        expect(textOf(tooltip, '.value')).toBe('1234 TPS');
        expect(textOf(tooltip, '.label')).toBe('3min ago');
    });
});

function showTooltip(dataPoint: { dataIndex: number; raw: number }): HTMLElement {
    const props = Bar.mock.calls.at(-1)?.[0] as { options: ChartOptions<'bar'> } | undefined;
    const external = props?.options.plugins?.tooltip?.external;
    if (!external) throw new Error('LiveTransactionStatsCard rendered no chart with an external tooltip');

    const invoke = external as unknown as (args: { chart: unknown; tooltip: unknown }) => void;
    invoke({
        chart: { canvas: { getBoundingClientRect: () => new DOMRect() } },
        tooltip: { body: [{}], caretX: 0, caretY: 0, dataPoints: [dataPoint], opacity: 1 },
    });

    // eslint-disable-next-line testing-library/no-node-access -- imperative Chart.js DOM, not a render
    const tooltip = document.getElementById('chartjs-tooltip');
    if (!tooltip) throw new Error('External tooltip handler created no element');
    return tooltip;
}

function textOf(tooltip: HTMLElement, selector: string): string | undefined {
    return tooltip.querySelector(selector)?.textContent ?? undefined;
}
