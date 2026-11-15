'use client';

import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { StatsNotReady } from '@components/StatsNotReady';
import { ClusterStatsStatus, PERF_UPDATE_SEC, usePerformanceInfo } from '@providers/stats/solanaClusterStats';
import { PerformanceInfo } from '@providers/stats/solanaPerformanceInfo';
import { BarElement, CategoryScale, Chart, ChartData, ChartOptions, LinearScale, Plugin, Tooltip } from 'chart.js';
import { renderText } from 'chart.js/helpers';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import CountUp from 'react-countup';

import { Button } from '@/app/components/shared/ui/button';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { useReducedMotion } from '@/app/shared/lib/use-reduced-motion';
import { KeyValue, TextValue } from '@/app/shared/ui/key-value';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

type Series = 'short' | 'medium' | 'long';
type SetSeries = (series: Series) => void;
const SERIES: Series[] = ['short', 'medium', 'long'];
// Wider than KeyValue's default: this card and Live Cluster Stats share a row at half the page width each,
// where the default 20% wraps "Transactions per second (TPS)" onto three lines. Both cards use it, so their
// value columns line up.
export const STATS_LABEL_WIDTH = 'w-2/5';
// The stats provider keeps the 30 latest bars of each series: one-minute samples as they come, then averaged by 4 and
// by 12. So 30 bars of `minutesPerBar` span exactly the `interval` on the button.
const BAR_COUNT = 30;
const SERIES_INFO = {
    long: { interval: '6h', minutesPerBar: 12 },
    medium: { interval: '2h', minutesPerBar: 4 },
    short: { interval: '30m', minutesPerBar: 1 },
};
// A time tick under every fifth bar: six per series, an hour apart on 6h and five minutes apart on 30m. The latest
// bar reads "now", by the TPS scale on the right.
const BARS_PER_TICK = 5;
// The `outer-space-300` token the texts around the chart use; the canvas takes a colour value, not a class.
const TICK_COLOR = '#91a4a1';
// The hovered bar's time takes the primary text colour, white, as the values in the card do.
const HOVERED_TICK_COLOR = '#ffffff';
// The space between bars, drawn as a transparent right border: each bar fills its whole slot, so the first one starts
// at the canvas edge, in line with the text above and below the chart.
const BAR_GAP = 2;

export function LiveTransactionStatsCard() {
    const [series, setSeries] = React.useState<Series>('short');
    return (
        <CollapsibleSection title="Live Transaction Stats" collapsible={false} fill>
            <TpsCardBody series={series} setSeries={setSeries} />
        </CollapsibleSection>
    );
}

function TpsCardBody({ series, setSeries }: { series: Series; setSeries: SetSeries }) {
    const performanceInfo = usePerformanceInfo();

    if (performanceInfo.status !== ClusterStatsStatus.Ready) {
        return <StatsNotReady error={performanceInfo.status === ClusterStatsStatus.Error} />;
    }

    return <TpsBarChart performanceInfo={performanceInfo} series={series} setSeries={setSeries} />;
}

const TPS_CHART_OPTIONS = (historyMaxTps: number, minutesPerBar: number): ChartOptions<'bar'> => {
    return {
        animation: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: false, // Disable the on-canvas tooltip
                external(context) {
                    // Tooltip Element
                    let tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = '<div class="content"></div>';
                        document.body.appendChild(tooltipEl);
                    }

                    // Hide if no tooltip, or over an empty slot the node had no history for
                    const tooltipModel = context.tooltip;
                    if (tooltipModel.opacity === 0 || tooltipModel.dataPoints[0]?.raw == null) {
                        tooltipEl.style.opacity = '0';
                        return;
                    }

                    // Set caret Position
                    tooltipEl.classList.remove('above', 'below', 'no-transform');
                    if (tooltipModel.yAlign) {
                        tooltipEl.classList.add(tooltipModel.yAlign);
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    // Set Text
                    if (tooltipModel.body) {
                        const { dataIndex, raw } = tooltipModel.dataPoints[0];
                        const tooltipContent = tooltipEl.querySelector('div');
                        if (tooltipContent) {
                            let innerHtml = `<div class="value">${raw} TPS</div>`;
                            innerHtml += `<div class="label">${(BAR_COUNT - dataIndex) * minutesPerBar}min ago</div>`;
                            tooltipContent.innerHTML = innerHtml;
                        }
                    }

                    const position = context.chart.canvas.getBoundingClientRect();

                    // Display, position, and set styles for font
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.position = 'absolute';
                    tooltipEl.style.left = `${position.left + window.pageXOffset + tooltipModel.caretX}px`;
                    tooltipEl.style.top = `${position.top + window.pageYOffset + tooltipModel.caretY}px`;
                    tooltipEl.style.pointerEvents = 'none';
                },
                intersect: false,
            },
        },
        resizeDelay: 0,
        scales: {
            x: {
                // No side padding: Chart.js would size it from the outermost labels and move the first bar off the edge.
                // `TIME_SCALE_PLUGIN` starts the first label at the edge instead; the last one stays centred, with room
                // to spare under the TPS scale.
                afterFit: scale => {
                    scale.paddingLeft = 0;
                    scale.paddingRight = 0;
                },
                grid: {
                    display: false,
                },
                ticks: {
                    autoSkip: false,
                    // The hovered bar's own time is drawn over these by `TIME_SCALE_PLUGIN`.
                    callback: (_value, index) =>
                        index === BAR_COUNT - 1 || index % BARS_PER_TICK === 0 ? barTime(index, minutesPerBar) : '',
                    color: TICK_COLOR,
                    display: true,
                    font: {
                        size: 10,
                    },
                    maxRotation: 0,
                },
            },
            y: {
                grid: {
                    display: false,
                },
                min: 0,
                position: 'right',
                suggestedMax: historyMaxTps,
                ticks: {
                    color: TICK_COLOR,
                    count: 5,
                    display: true,
                    font: {
                        size: 10,
                    },
                    precision: 0,
                    stepSize: 500,
                    textStrokeColor: '#EEE',
                },
            },
        },
    };
};

type TpsBarChartProps = {
    performanceInfo: PerformanceInfo;
    series: Series;
    setSeries: SetSeries;
};
function TpsBarChart({ performanceInfo, series, setSeries }: TpsBarChartProps) {
    const { perfHistory, avgTps, historyMaxTps } = performanceInfo;
    const averageTps = Math.round(avgTps != null ? avgTps : 0.0).toLocaleString('en-US');
    const transactionCount = <AnimatedTransactionCount info={performanceInfo} />;
    const { minutesPerBar } = SERIES_INFO[series];
    // A node with less history than the interval returns fewer bars; the empty slots in front keep the axis at the
    // full interval instead of stretching the bars it has across it.
    const seriesData = padStart(perfHistory[series], BAR_COUNT);
    const chartOptions = React.useMemo<ChartOptions<'bar'>>(
        () => TPS_CHART_OPTIONS(historyMaxTps, minutesPerBar),
        [historyMaxTps, minutesPerBar],
    );

    // The external tooltip div is appended to document.body, outside React; without mouseout (e.g. keyboard
    // navigation) it would otherwise linger after the chart unmounts.
    React.useEffect(() => () => document.getElementById('chartjs-tooltip')?.remove(), []);

    const chartData: ChartData<'bar'> = {
        datasets: [
            {
                backgroundColor: '#00D192',
                barPercentage: 1,
                borderColor: 'transparent',
                borderSkipped: false,
                borderWidth: { bottom: 0, left: 0, right: BAR_GAP, top: 0 },
                categoryPercentage: 1,
                data: seriesData.map(val => (val === undefined ? null : val || 0)),
                hoverBackgroundColor: '#00D192',
                hoverBorderColor: 'transparent',
            },
        ],
        // Each bar's place on the time scale; `TIME_SCALE_PLUGIN` shows it under the hovered bar.
        labels: seriesData.map((_val, i) => barTime(i, minutesPerBar)),
    };

    return (
        <div className="flex grow flex-col">
            <KeyValue label="Transaction count" labelWidth={STATS_LABEL_WIDTH}>
                <TextValue mono={false}>{transactionCount}</TextValue>
            </KeyValue>
            <KeyValue label="Transactions per second (TPS)" labelWidth={STATS_LABEL_WIDTH}>
                <TextValue mono={false}>{averageTps}</TextValue>
            </KeyValue>

            <div className="flex grow flex-col gap-3 px-3 py-3">
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-sm text-outer-space-300">TPS history</span>

                    <div className="flex gap-1.5">
                        {SERIES.map(key => (
                            <Button
                                key={key}
                                variant={series === key ? 'default' : 'outline'}
                                size="sm"
                                aria-pressed={series === key}
                                onClick={() => setSeries(key)}
                            >
                                {SERIES_INFO[key].interval}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Side by side with Live Cluster Stats, the chart takes whatever height that card leaves, so
                    the cluster card sets the row's height. The canvas is absolute so its size never feeds back
                    into the row; the 120px floor keeps it readable if the cluster card comes up short. */}
                <div id="perf-history" className="relative h-[200px] md:h-auto md:min-h-[120px] md:grow">
                    <Bar
                        className="absolute inset-0"
                        data={chartData}
                        options={chartOptions}
                        plugins={[TIME_SCALE_PLUGIN]}
                    />
                </div>

                <p className="m-0 text-sm text-outer-space-300">
                    Transaction confirmation stats are available on{' '}
                    <ExternalLink href="https://www.validators.app">validators.app</ExternalLink> and{' '}
                    <ExternalLink href="https://solscan.io">solscan.io</ExternalLink>
                </p>
            </div>
        </div>
    );
}

function AnimatedTransactionCount({ info }: { info: PerformanceInfo }) {
    const reducedMotion = useReducedMotion();
    const txCountRef = React.useRef(0);
    const countUpRef = React.useRef({ lastUpdate: 0, period: 0, start: 0 });
    const countUp = countUpRef.current;

    const { transactionCount, avgTps } = info;
    const txCount = Number(transactionCount);

    // Skip the running count-up animation under reduced motion — render the settled value directly.
    if (reducedMotion) return <>{txCount.toLocaleString('en-US')}</>;

    // Track last tx count to reset count up options
    if (txCount !== txCountRef.current) {
        if (countUp.lastUpdate > 0) {
            // Since we overshoot below, calculate the elapsed value
            // and start from there.
            const elapsed = Date.now() - countUp.lastUpdate;
            const elapsedPeriods = elapsed / (PERF_UPDATE_SEC * 1000);
            countUp.start = Math.floor(countUp.start + elapsedPeriods * countUp.period);

            // if counter gets ahead of actual count, just hold for a bit
            // until txCount catches up (this will sometimes happen when a tab is
            // sent to the background and/or connection drops)
            countUp.period = Math.max(txCount - countUp.start, 1);
        } else {
            // Since this is the first tx count value, estimate the previous
            // tx count in order to have a starting point for our animation
            countUp.period = PERF_UPDATE_SEC * (avgTps != null ? avgTps : 0.0);
            countUp.start = txCount - countUp.period;
        }
        countUp.lastUpdate = Date.now();
        txCountRef.current = txCount;
    }

    // Overshoot the target tx count in case the next update is delayed
    const COUNT_PERIODS = 3;
    const countUpEnd = countUp.start + COUNT_PERIODS * countUp.period;
    return (
        <CountUp
            start={countUp.start}
            end={countUpEnd}
            duration={PERF_UPDATE_SEC * COUNT_PERIODS}
            delay={0}
            useEasing={false}
            preserveValue={true}
            separator=","
        />
    );
}

/** Missing bars, oldest first, as `undefined` so they render as empty slots rather than zero TPS. */
function padStart<T>(series: T[], length: number): (T | undefined)[] {
    return [...Array<undefined>(Math.max(0, length - series.length)).fill(undefined), ...series.slice(-length)];
}

/**
 * Two touches to the time scale Chart.js cannot express per label.
 *
 * 1. The first label starts at the first bar's left edge, in line with the text above and below the chart; centred
 *    under a bar at the canvas edge it would be cut.
 * 2. The hovered bar's time is written under it, in white, over the regular ticks: the labels it covers are cleared
 *    first, and the canvas is transparent, so the card shows through instead of a painted patch. The ticks themselves
 *    never change, so neither does the layout.
 */
const TIME_SCALE_PLUGIN: Plugin<'bar'> = {
    afterDraw(chart) {
        const index = chart.getActiveElements()[0]?.index;
        const scale = chart.scales.x;
        const text = index === undefined ? undefined : chart.data.labels?.[index];
        const item = index === undefined ? undefined : scale?.getLabelItems()[index];
        if (!scale || !item || typeof text !== 'string') return;

        const { ctx } = chart;
        ctx.save();
        ctx.font = item.font.string;
        const textWidth = ctx.measureText(text).width;
        const [x] = item.options.translation ?? [0, 0];
        const { textAlign } = item.options;
        const textLeft = textAlign === 'left' ? x : textAlign === 'right' ? x - textWidth : x - textWidth / 2;
        // Kept whole on the canvas: under a bar at either edge the time would otherwise be cut.
        const left = Math.min(Math.max(textLeft, 0), chart.width - textWidth);
        const [, y] = item.options.translation ?? [0, 0];
        ctx.clearRect(left - HOVERED_TIME_GAP, scale.top, textWidth + 2 * HOVERED_TIME_GAP, scale.height);
        renderText(ctx, text, 0, item.textOffset, item.font, {
            ...item.options,
            color: HOVERED_TICK_COLOR,
            textAlign: 'left',
            translation: [left, y],
        });
        ctx.restore();
    },
    // The scale draws from the label items it caches, so moving the first one here moves the drawn label.
    beforeDraw(chart) {
        const scale = chart.scales.x;
        const first = scale?.getLabelItems()[0];
        if (!scale || !first) return;
        const [, y] = first.options.translation ?? [0, 0];
        first.options.translation = [scale.left, y];
        first.options.textAlign = 'left';
    },
    id: 'timeScale',
};

// Clear space either side of the hovered time, so a covered tick never shows a sliver against it.
const HOVERED_TIME_GAP = 4;

/** A bar's place on the time scale: "now" for the latest, otherwise how long ago it starts. */
function barTime(index: number, minutesPerBar: number) {
    return index === BAR_COUNT - 1 ? 'now' : formatMinutesAgo((BAR_COUNT - index) * minutesPerBar);
}

/** "30m", "2h", "1h 40m": how long ago a time tick is, short enough for six to fit under a half-width chart. */
function formatMinutesAgo(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest}m`;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
