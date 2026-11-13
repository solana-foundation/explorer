import type { ComponentType, ReactNode } from 'react';

export type ResourcePreviewName = 'coreConcepts' | 'developerTools' | 'jobs' | 'quickStart' | 'transactions';

export function ResourcePreview({ name }: { name: ResourcePreviewName }) {
    const Preview = PREVIEWS[name];
    return <Preview />;
}

const PREVIEWS: Record<ResourcePreviewName, ComponentType> = {
    coreConcepts: CoreConceptsPreview,
    developerTools: DeveloperToolsPreview,
    jobs: JobsPreview,
    quickStart: QuickStartPreview,
    transactions: TransactionsPreview,
};

function TransactionsPreview() {
    const cells: { x: number; y: number; opacity: number; accent: boolean }[] = [];
    for (let row = 0; row < 5; row++) {
        // The last row stops short: a message has a length, not a fixed block size.
        const columns = row === 4 ? 9 : 14;
        for (let column = 0; column < columns; column++) {
            cells.push({
                accent: row === 0 && column < 2,
                opacity: 0.12 + ((column * 7 + row * 3) % 5) * 0.05,
                x: 54 + column * 10,
                y: 37 + row * 10,
            });
        }
    }
    return (
        <PreviewFrame>
            {cells.map(({ x, y, opacity, accent }) => (
                <rect key={`${x}-${y}`} x={x} y={y} width={6} height={6} fill={accent ? ACCENT : ink(opacity)} />
            ))}
        </PreviewFrame>
    );
}

function CoreConceptsPreview() {
    const nodes = Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
        return [125 + Math.cos(angle) * 72, 60 + Math.sin(angle) * 36];
    });
    return (
        <PreviewFrame>
            {nodes.map(([x, y]) => (
                <line key={`${x}-${y}`} x1={125} x2={x} y1={60} y2={y} stroke={ink(0.25)} strokeWidth={0.75} />
            ))}
            {nodes.map(([x, y]) => (
                <Square key={`${x}-${y}`} x={x} y={y} />
            ))}
            <circle cx={125} cy={60} r={12} fill={BACKGROUND} stroke={ACCENT} strokeWidth={1} />
            <circle cx={125} cy={60} r={2.5} fill={ACCENT} />
        </PreviewFrame>
    );
}

function DeveloperToolsPreview() {
    return (
        <PreviewFrame>
            <path
                d="M 100 44 L 116 60 L 100 76"
                stroke={ink(0.6)}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect x={124} y={72} width={26} height={4} fill={ACCENT} />
        </PreviewFrame>
    );
}

function QuickStartPreview() {
    return (
        <PreviewFrame>
            <path d="M 45 90 H 85 V 70 H 125 V 50 H 165 V 30" stroke={ink(0.35)} strokeWidth={0.75} />
            <line x1={165} x2={205} y1={30} y2={30} stroke={ACCENT} strokeWidth={1} />
            <circle cx={205} cy={30} r={2.5} fill={ACCENT} />
        </PreviewFrame>
    );
}

function JobsPreview() {
    return (
        <PreviewFrame>
            <Globe />
            {[
                [61, 44],
                [93, 76],
                [141, 28],
                [165, 68],
                [197, 52],
                [117, 92],
            ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={ACCENT} />
            ))}
        </PreviewFrame>
    );
}

const ACCENT = '#1dd79b';
// Match the card surface so shapes cover the lines behind them.
const BACKGROUND = '#0f1513';

function ink(opacity: number) {
    return `rgba(229, 235, 233, ${opacity})`;
}

function PreviewFrame({ children }: { children: ReactNode }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 250 120"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            className="block h-full w-full"
            style={{ backgroundColor: BACKGROUND }}
        >
            {children}
        </svg>
    );
}

function Square({ x, y }: { x: number; y: number }) {
    return <rect x={x - 5} y={y - 5} width={10} height={10} fill={BACKGROUND} stroke={ink(0.6)} strokeWidth={0.75} />;
}

function Globe() {
    const dots: [number, number][] = [];
    for (let x = 13; x <= 237; x += 8) {
        for (let y = 12; y <= 108; y += 8) {
            if (((x - 125) / 112) ** 2 + ((y - 60) / 52) ** 2 <= 1) dots.push([x, y]);
        }
    }
    return (
        <>
            {dots.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill={ink(0.2)} />
            ))}
        </>
    );
}
