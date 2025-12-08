import { InstructionCUData } from '@utils/cu-profiling';
import { BarElement, CategoryScale, Chart, ChartData, ChartOptions, LinearScale, Tooltip } from 'chart.js';
import React from 'react';
import { Bar } from 'react-chartjs-2';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

type ExtendedBarDataset = ChartData<'bar'>['datasets'][number] & {
    displayUnits?: number;
    reservedValue?: number;
    actualCU?: number;
    minValue: number;
};

const getCUProfileChartOptions = (totalCU: number): ChartOptions<'bar'> => {
    let currentMouseX = 0;

    return {
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
            // Capture actual mouse position for the tooltip
            if (event.native) {
                currentMouseX = (event.native as MouseEvent).clientX;
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

                    const tooltipRect = tooltipEl.getBoundingClientRect();
                    const tooltipWidth = tooltipRect.width || 180; // min-width

                    const chartCanvas = context.chart.canvas;
                    const canvasRect = chartCanvas.getBoundingClientRect();

                    let left = currentMouseX;
                    const top = canvasRect.top;
                    let transform = 'translate(-50%, calc(-100% - 10px))';

                    // Check right edge
                    if (currentMouseX + tooltipWidth / 2 > canvasRect.right) {
                        left = currentMouseX;
                        transform = 'translate(-100%, calc(-100% - 10px))';
                    }

                    // Check left edge
                    if (currentMouseX - tooltipWidth / 2 < canvasRect.left) {
                        left = currentMouseX;
                        transform = 'translate(0, calc(-100% - 10px))';
                    }

                    tooltipEl.style.left = left + 'px';
                    tooltipEl.style.top = top + 'px';
                    tooltipEl.style.transform = transform;
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
    };
};

function getInstructionColor(index: number): string {
    const colors = ['#20D79B', '#19A97A', '#137C5A', '#0C503A', '#093A2A'];

    // Use % to cycle through colors if there are more instructions than colors
    return colors[index % colors.length];
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
        [instructions]
    );

    const totalDisplayCU = React.useMemo(
        () => instructionsWithDisplay.reduce((sum, item) => sum + item.displayCU, 0),
        [instructionsWithDisplay]
    );

    React.useEffect(() => {
        return () => {
            const tooltipEl = document.getElementById('cu-chartjs-tooltip');
            if (tooltipEl) {
                tooltipEl.remove();
            }
        };
    }, []);

    const chartOptions = React.useMemo<ChartOptions<'bar'>>(
        () => getCUProfileChartOptions(totalDisplayCU),
        [totalDisplayCU]
    );

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
        [instructionsWithDisplay]
    );

    if (instructions.length === 0) return null;

    return (
        <div className="e-card">
            <div className="card-header">
                <h3 className="card-header-title">CU profiling</h3>
            </div>
            <div className="e-card-body">
                {Boolean(unitsConsumed) && <div className="mb-3">Total: {unitsConsumed?.toLocaleString()} CU</div>}

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
            </div>
        </div>
    );
}
