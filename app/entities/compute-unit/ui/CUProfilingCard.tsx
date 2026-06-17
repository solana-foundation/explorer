import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { BarElement, CategoryScale, Chart, type ChartData, type ChartOptions, LinearScale, Tooltip } from 'chart.js';
import React from 'react';
import { Bar } from 'react-chartjs-2';

import { baseCardVariants, CardBody } from '@/app/shared/ui/Card';

import type { InstructionCUData } from '../lib/types';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

type ExtendedBarDataset = ChartData<'bar'>['datasets'][number] & {
    displayUnits?: number;
    reservedValue?: number;
    actualCU?: number;
    minValue: number;
};

function getInstructionColor(index: number): string {
    const colors = ['#20D79B', '#19A97A', '#137C5A', '#0C503A', '#093A2A'];

    // Use % to cycle through colors if there are more instructions than colors
    return colors[index % colors.length];
}

function useCUTooltipCleanup() {
    React.useEffect(() => {
        const hideTooltip = () => {
            const tooltipEl = document.getElementById('cu-chartjs-tooltip');
            if (tooltipEl) tooltipEl.style.opacity = '0';
        };
        window.addEventListener('scroll', hideTooltip, true);
        return () => {
            window.removeEventListener('scroll', hideTooltip, true);
            const tooltipEl = document.getElementById('cu-chartjs-tooltip');
            if (tooltipEl) tooltipEl.remove();
        };
    }, []);
}

function useCUProfileChartOptions(totalCU: number): ChartOptions<'bar'> {
    const posRef = React.useRef({ x: 0, y: 0 });

    return React.useMemo<ChartOptions<'bar'>>(
        () => ({
            animation: false,
            indexAxis: 'y',
            interaction: {
                intersect: false,
                mode: 'point',
            },
            layout: {
                padding: 0,
            },
            maintainAspectRatio: false,
            onHover: (event, activeElements) => {
                const canvas = event.native?.target as HTMLElement;
                if (canvas) {
                    canvas.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
                }
                // Capture pointer position — supports both mouse and touch events
                if (event.native) {
                    const nativeEvent = event.native as MouseEvent | TouchEvent;
                    if ('touches' in nativeEvent && nativeEvent.touches.length > 0) {
                        posRef.current.x = nativeEvent.touches[0].clientX;
                        posRef.current.y = nativeEvent.touches[0].clientY;
                    } else {
                        posRef.current.x = (nativeEvent as MouseEvent).clientX;
                        posRef.current.y = (nativeEvent as MouseEvent).clientY;
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: false,
                    external(context) {
                        let tooltipEl = document.getElementById('cu-chartjs-tooltip');

                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'cu-chartjs-tooltip';
                            tooltipEl.innerHTML = '<div class="content"></div>';
                            document.body.appendChild(tooltipEl);
                        }

                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = '0';
                            return;
                        }

                        if (tooltipModel.body) {
                            const dataPoint = tooltipModel.dataPoints[0];
                            const instructionLabel = dataPoint.dataset.label;
                            const color = dataPoint.dataset.backgroundColor;
                            const dataset = dataPoint.dataset as ExtendedBarDataset;

                            const value = dataset.actualCU || dataset.reservedValue || dataset.displayUnits;

                            const isReserved = !dataset.actualCU && !dataset.reservedValue && dataset.displayUnits;
                            const cuValue = value?.toLocaleString();
                            const cuText = isReserved ? 'CU reserved' : 'CU consumed';

                            const tooltipContent = tooltipEl.querySelector('div');
                            if (tooltipContent) {
                                tooltipContent.innerHTML = `
                                <div style="
                                    background: rgba(30, 30, 30, 0.95);
                                    backdrop-filter: blur(10px);
                                    border-radius: 8px;
                                    padding: 12px 16px;
                                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                                    min-width: 180px;
                                ">
                                    <div style="
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                        margin-bottom: 6px;
                                    ">
                                        <div style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 2px;
                                            background-color: ${color};
                                        "></div>
                                        <div style="
                                            color: white;
                                            font-size: 14px;
                                            font-weight: 600;
                                        ">${instructionLabel}</div>
                                    </div>
                                    <div style="
                                        color: rgba(255, 255, 255, 0.9);
                                        font-size: 13px;
                                        padding-left: 20px;
                                    ">${isReserved ? '~' : ''}${cuValue} ${cuText}</div>
                                </div>
                            `;
                            }
                        }

                        // Use captured mouse position with edge detection
                        tooltipEl.style.opacity = '1';
                        tooltipEl.style.position = 'fixed';
                        tooltipEl.style.pointerEvents = 'none';
                        tooltipEl.style.transition = 'all 0.1s ease';
                        tooltipEl.style.zIndex = '9999';

                        const { width: tw = 180, height: th = 70 } = tooltipEl.getBoundingClientRect();
                        const gap = 10;
                        const left = Math.max(0, Math.min(window.innerWidth - tw, posRef.current.x - tw / 2));
                        const top =
                            posRef.current.y - th - gap < 0 ? posRef.current.y + gap : posRef.current.y - th - gap;

                        tooltipEl.style.left = `${left}px`;
                        tooltipEl.style.top = `${top}px`;
                        tooltipEl.style.transform = '';
                    },
                },
            },
            resizeDelay: 0,
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    max: totalCU,
                    stacked: true,
                    ticks: {
                        display: false,
                    },
                },
                y: {
                    grid: {
                        display: false,
                    },
                    stacked: true,
                    ticks: {
                        display: false,
                    },
                },
            },
        }),
        [totalCU],
    );
}

type CUProfilingCardProps = {
    instructions: InstructionCUData[];
    unitsConsumed?: number;
};

export function CUProfilingCard({ instructions, unitsConsumed }: CUProfilingCardProps) {
    const instructionsWithDisplay = React.useMemo(
        () =>
            instructions.map(item => ({
                ...item,
                displayCU: item.computeUnits || item.reservedValue || item.displayUnits || item.minValue,
            })),
        [instructions],
    );

    const totalDisplayCU = React.useMemo(
        () => instructionsWithDisplay.reduce((sum, item) => sum + item.displayCU, 0),
        [instructionsWithDisplay],
    );

    useCUTooltipCleanup();

    const chartOptions = useCUProfileChartOptions(totalDisplayCU);

    const chartData: ChartData<'bar'> = React.useMemo(
        () => ({
            datasets: instructionsWithDisplay.map((item, i) => ({
                actualCU: item.computeUnits,
                backgroundColor: getInstructionColor(i),
                barThickness: 24,
                // Apply border radius only to the outer edges of the stacked bar
                // round left corners, round right corners
                borderRadius: {
                    bottomLeft: i === 0 ? 4 : 0,
                    bottomRight: i === instructionsWithDisplay.length - 1 ? 4 : 0,
                    topLeft: i === 0 ? 4 : 0,
                    topRight: i === instructionsWithDisplay.length - 1 ? 4 : 0,
                },
                borderSkipped: false,
                borderWidth: 0,
                data: [item.displayCU],
                displayUnits: item.displayUnits,
                hoverBackgroundColor: getInstructionColor(i),
                label: `Instruction #${i + 1}`,
                minValue: item.minValue,
                reservedValue: item.reservedValue,
            })),
            labels: [''],
        }),
        [instructionsWithDisplay],
    );

    if (instructions.length === 0) return null;

    return (
        <CollapsibleCard title="CU profiling" className={baseCardVariants({ ui: 'dashkit' })}>
            <CardBody ui="dashkit">
                {Boolean(unitsConsumed) && <div className="e-mb-3">Total: {unitsConsumed?.toLocaleString()} CU</div>}

                <div style={{ height: '32px', marginLeft: '-8px' }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>

                {/* Legend */}
                <div className="e-mt-3 e-flex e-flex-wrap e-gap-3 e-text-xs">
                    {instructions.map((item, i) => {
                        const isReserved = !item.computeUnits && !item.reservedValue && item.displayUnits;
                        const value = item.computeUnits || item.reservedValue || item.displayUnits;

                        return (
                            <div key={i} className="e-align-items-center e-flex">
                                <div
                                    style={{
                                        backgroundColor: getInstructionColor(i),
                                        borderRadius: '4px',
                                        height: '16px',
                                        marginRight: '8px',
                                        width: '16px',
                                    }}
                                />
                                <span>
                                    Instruction #{i + 1}: {isReserved && '~'}
                                    {value ? value.toLocaleString() : 'Unknown'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </CollapsibleCard>
    );
}
