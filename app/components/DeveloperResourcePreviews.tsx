import type { ComponentType, ReactNode } from 'react';

// Line drawings in the style of the explorer's feature cards: thin light lines at low opacity, one accent, mono labels.
// They are drawn here rather than loaded because solana.com's own preview images for these pages fail to load.

export type ResourcePreviewName = 'coreConcepts' | 'developerTools' | 'jobs' | 'quickStart' | 'transactions';

/** The preview drawing for one developer resource. */
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

/** The transaction's parts: the signatures and the first two account keys share the accent. */
function TransactionsPreview() {
    return (
        <PreviewFrame>
            <g transform="translate(38 0)">
                <Label x={16} y={28.5}>
                    signatures
                </Label>
                <Cells x={96} y={26} count={2} accent={2} />
                <Label x={16} y={44.5}>
                    message
                </Label>
                <path d="M 19 48 V 92 M 19 60 H 25 M 19 76 H 25 M 19 92 H 25" stroke={ink(0.25)} strokeWidth={0.75} />
                <Label x={29} y={62.5}>
                    account keys
                </Label>
                <Cells x={96} y={60} count={4} accent={2} />
                <Label x={29} y={78.5}>
                    blockhash
                </Label>
                <rect x={96} y={73.5} width={46} height={5} fill={ink(0.3)} />
                <Label x={29} y={94.5}>
                    instructions
                </Label>
                <Cells x={96} y={92} count={3} />
            </g>
        </PreviewFrame>
    );
}

/** A transaction on the left, the program it calls in the middle, the accounts it touches on the right. */
function CoreConceptsPreview() {
    const accounts = [44, 76];
    return (
        <PreviewFrame>
            <rect x={30} y={22} width={70} height={76} rx={3} stroke={ink(0.25)} strokeWidth={0.75} />
            <Label x={36} y={33}>
                transaction
            </Label>
            {[44, 60, 76].map(y => (
                <rect key={y} x={36} y={y} width={58} height={10} rx={2} stroke={ink(0.35)} strokeWidth={0.75} />
            ))}

            <line x1={100} x2={138} y1={60} y2={60} stroke={ink(0.3)} strokeWidth={0.75} />
            {accounts.map(y => (
                <path key={y} d={`M 162 60 C 180 60, 184 ${y}, 201 ${y}`} stroke={ink(0.3)} strokeWidth={0.75} />
            ))}
            <circle cx={150} cy={60} r={12} fill={BACKGROUND} stroke={ACCENT} strokeWidth={1} />
            <circle cx={150} cy={60} r={2.5} fill={ACCENT} />
            <Label x={150} y={40} anchor="middle">
                program
            </Label>

            <Label x={206} y={30} anchor="middle">
                accounts
            </Label>
            {accounts.map(y => (
                <Square key={y} x={206} y={y} />
            ))}
        </PreviewFrame>
    );
}

/** A terminal window with the CLI's version command and a blinking cursor. */
function DeveloperToolsPreview() {
    return (
        <PreviewFrame>
            <rect x={50} y={18} width={150} height={84} rx={3} stroke={ink(0.35)} strokeWidth={0.75} />
            <line x1={50} x2={200} y1={29} y2={29} stroke={ink(0.35)} strokeWidth={0.75} />
            {[56, 62, 68].map(cx => (
                <circle key={cx} cx={cx} cy={23.5} r={1.4} stroke={ink(0.45)} strokeWidth={0.75} />
            ))}
            <Label x={60} y={48} opacity={0.7}>
                $ solana --version
            </Label>
            <Label x={60} y={61} opacity={0.4}>
                solana-cli 2.2.0
            </Label>
            <Label x={60} y={87} opacity={0.7}>
                $
            </Label>
            <rect x={68} y={81} width={4} height={7} fill={ACCENT} />
        </PreviewFrame>
    );
}

/** Write, build, deploy: the first two steps done, the third ahead. */
function QuickStartPreview() {
    return (
        <PreviewFrame>
            <line x1={125} x2={190} y1={52} y2={52} stroke={ink(0.25)} strokeWidth={0.75} strokeDasharray="3 2" />
            <line x1={60} x2={125} y1={52} y2={52} stroke={ACCENT} strokeWidth={1} />
            <Step x={60} y={52} number="1" label="write" done />
            <Step x={125} y={52} number="2" label="build" done />
            <Step x={190} y={52} number="3" label="deploy" />
        </PreviewFrame>
    );
}

/** Openings pinned across a globe of dots. */
function JobsPreview() {
    const pins: { x: number; y: number; label?: string }[] = [
        { label: 'rust', x: 61, y: 44 },
        { x: 93, y: 76 },
        { label: 'frontend', x: 141, y: 28 },
        { x: 165, y: 68 },
        { label: 'devrel', x: 197, y: 52 },
        { x: 117, y: 92 },
    ];
    const dots: [number, number][] = [];
    for (let x = 13; x <= 237; x += 8) {
        for (let y = 12; y <= 108; y += 8) {
            // An ellipse of dots reads as the globe the openings are spread across.
            if (((x - 125) / 112) ** 2 + ((y - 60) / 52) ** 2 <= 1) dots.push([x, y]);
        }
    }
    return (
        <PreviewFrame>
            {dots.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill={ink(0.2)} />
            ))}
            {pins.map(({ x, y, label }) => (
                <g key={`${x}-${y}`}>
                    <ellipse cx={x} cy={y} rx={6} ry={2.5} stroke={ink(0.25)} strokeWidth={0.75} />
                    <line x1={x} x2={x} y1={y} y2={y - 9} stroke={ACCENT} strokeWidth={1} />
                    <circle cx={x} cy={y - 10} r={2} fill={ACCENT} />
                    {label && (
                        <Label x={x + 6} y={y - 8}>
                            {label}
                        </Label>
                    )}
                </g>
            ))}
        </PreviewFrame>
    );
}

const ACCENT = '#1dd79b';
// The card's own surface, so shapes drawn over lines cut them cleanly.
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

function Label({
    x,
    y,
    children,
    anchor = 'start',
    color,
    opacity = 0.55,
}: {
    x: number;
    y: number;
    children: string;
    anchor?: 'start' | 'middle' | 'end';
    color?: string;
    opacity?: number;
}) {
    return (
        <text x={x} y={y} textAnchor={anchor} fontSize={7} className="font-mono" fill={color ?? ink(opacity)}>
            {children}
        </text>
    );
}

function Cells({ x, y, count, accent = 0 }: { x: number; y: number; count: number; accent?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, index) => (
                <rect
                    key={index}
                    x={x + index * 8}
                    y={y - 2.5}
                    width={6}
                    height={5}
                    fill={index < accent ? ACCENT : ink(0.3)}
                />
            ))}
        </>
    );
}

function Square({ x, y }: { x: number; y: number }) {
    return <rect x={x - 5} y={y - 5} width={10} height={10} fill={BACKGROUND} stroke={ink(0.6)} strokeWidth={0.75} />;
}

/** A numbered step box with its name under it; a done step is in the accent. */
function Step({
    x,
    y,
    number,
    label,
    done = false,
}: {
    x: number;
    y: number;
    number: string;
    label: string;
    done?: boolean;
}) {
    return (
        <>
            <rect
                x={x - 7}
                y={y - 7}
                width={14}
                height={14}
                rx={2}
                fill={BACKGROUND}
                stroke={done ? ACCENT : ink(0.45)}
                strokeWidth={1}
            />
            <Label x={x} y={y + 2.5} anchor="middle" color={done ? ACCENT : undefined}>
                {number}
            </Label>
            <Label x={x} y={y + 19} anchor="middle">
                {label}
            </Label>
        </>
    );
}
