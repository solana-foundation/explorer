import { BarElement, CategoryScale, Chart, ChartData, ChartOptions, LinearScale, Tooltip } from 'chart.js';
import React from 'react';
import { Bar } from 'react-chartjs-2';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

const MAX_BARS = 10;
const MIN_BAR_CU = 3000; // Minimum CU to show for instructions with 0 CU

const CU_PROFILE_CHART_OPTIONS = (totalCU: number): ChartOptions<'bar'> => {
    let currentMouseX = 0;
    let currentMouseY = 0;

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
                currentMouseY = (event.native as MouseEvent).clientY;
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
                        const cuValue = dataPoint.parsed.x.toLocaleString();
                        const color = dataPoint.dataset.backgroundColor as string;

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
                                    ">${cuValue} CU consumed</div>
                                </div>
                            `;
                        }
                    }

                    // Use captured mouse position
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.position = 'fixed';
                    tooltipEl.style.left = currentMouseX + 'px';
                    tooltipEl.style.top = currentMouseY + 'px';
                    tooltipEl.style.pointerEvents = 'none';
                    tooltipEl.style.transform = 'translate(-50%, calc(-100% - 10px))';
                    tooltipEl.style.transition = 'all 0.1s ease';
                    tooltipEl.style.zIndex = '9999';
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

export type InstructionCUData = {
    computeUnits: number;
    programId: string;
    displayUnits?: string;
};

type CUProfilingCardProps = {
    instructions: InstructionCUData[];
};

export function CUProfilingCard({ instructions }: CUProfilingCardProps) {
    const instructionsWithDisplay = React.useMemo(
        () =>
            instructions.map(item => ({
                ...item,
                displayCU: item.computeUnits === 0 ? MIN_BAR_CU : item.computeUnits,
            })),
        [instructions]
    );

    const totalCU = React.useMemo(() => instructions.reduce((sum, item) => sum + item.computeUnits, 0), [instructions]);

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
        () => CU_PROFILE_CHART_OPTIONS(totalDisplayCU),
        [totalDisplayCU]
    );

    const chartData: ChartData<'bar'> = React.useMemo(
        () => ({
            datasets: instructionsWithDisplay.map((ix, i) => ({
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
                data: [ix.displayCU],
                hoverBackgroundColor: getInstructionColor(i),
                label: `Instruction #${i + 1}`,
            })),
            labels: [''],
        }),
        [instructionsWithDisplay]
    );

    if (instructions.length === 0) return null;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">CU profiling</h3>
            </div>
            <div className="card-body">
                <div className="mb-3">Total: {totalCU.toLocaleString()}</div>

                <div style={{ height: '32px', marginLeft: '-8px' }}>
                    <Bar data={chartData} options={chartOptions} />
                </div>

                {/* Legend */}
                <div className="d-flex flex-wrap gap-3 mt-3" style={{ fontSize: '14px' }}>
                    {instructions.map((item, i) => (
                        <div key={i} className="d-flex align-items-center">
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
                                Instruction #{i + 1}:{' '}
                                {item.displayUnits ? item.displayUnits : item.computeUnits.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {instructions.length > MAX_BARS && (
                        <div className="d-flex align-items-center">
                            <span>
                                Other:{' '}
                                {instructions
                                    .slice(MAX_BARS)
                                    .reduce((sum, item) => sum + item.computeUnits, 0)
                                    .toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
