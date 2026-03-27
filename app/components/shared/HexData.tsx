import { Copyable } from '@components/common/Copyable';
import { cva } from 'class-variance-authority';
import React from 'react';

import { ByteArray, toHex } from '@/app/shared/lib/bytes';

import { cn } from './utils';

export type HexSpan = { text: string; variant: 'primary' | 'secondary' | 'secondary-old' };
export type HexRow = HexSpan[];

const SPAN_SIZE = 4;
const ROW_SIZE = 4 * SPAN_SIZE;
const TRUNCATE_EDGE_BYTES = 8;

export function splitHexPairs(hex: string): string[] {
    const pairs: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        pairs.push(hex.slice(i, i + 2));
    }
    return pairs;
}

// Truncate pairs to head … tail, inserting an ellipsis marker.
// Returns the original pairs unchanged if below threshold.
export function truncateHexPairs(pairs: string[]): { pairs: string[]; truncated: boolean } {
    if (pairs.length <= TRUNCATE_EDGE_BYTES * 2) {
        return { pairs, truncated: false };
    }
    return {
        pairs: [...pairs.slice(0, TRUNCATE_EDGE_BYTES), '\u2026', ...pairs.slice(-TRUNCATE_EDGE_BYTES)],
        truncated: true,
    };
}

// Group pairs into alternating-color spans of SPAN_SIZE.
// The ellipsis marker (\u2026) gets its own span.
// When inverted, the first span is secondary-old and the second is primary (greenish first, white second).
export function formatHexSpans(pairs: string[], options: { inverted?: boolean } = {}): HexSpan[] {
    const first: HexSpan['variant'] = options.inverted ? 'secondary-old' : 'primary';
    const second: HexSpan['variant'] = options.inverted ? 'primary' : 'secondary-old';
    const spans: HexSpan[] = [];
    let pairIndex = 0;

    for (let i = 0; i < pairs.length; ) {
        if (pairs[i] === '\u2026') {
            spans.push({ text: '\u2026', variant: second });
            i++;
            continue;
        }

        const variant = pairIndex % (2 * SPAN_SIZE) === 0 ? first : second;
        const chunk = pairs.slice(i, i + SPAN_SIZE).filter(p => p !== '\u2026');
        spans.push({ text: chunk.join(' '), variant });
        pairIndex += SPAN_SIZE;
        i += chunk.length;
    }

    return spans;
}

// Group spans into rows of ROW_SIZE / SPAN_SIZE for the full hex dump view.
export function groupHexRows(spans: HexSpan[]): HexRow[] {
    const spansPerRow = ROW_SIZE / SPAN_SIZE;
    const rows: HexRow[] = [];
    for (let i = 0; i < spans.length; i += spansPerRow) {
        rows.push(spans.slice(i, i + spansPerRow));
    }
    return rows;
}

// ── Component ────────────────────────────────────────────────────────

export function HexData({
    raw,
    className,
    copyableRaw,
    truncate = false,
    inverted = false,
}: {
    raw: ByteArray;
    copyableRaw?: ByteArray;
    className?: string;
    truncate?: boolean;
    inverted?: boolean;
}) {
    if (!raw || raw.length === 0) {
        return <span>No data</span>;
    }

    const hexString = toHex(raw);
    const copyText = copyableRaw ? toHex(copyableRaw) : hexString;

    if (truncate) {
        return <TruncatedContent hexString={hexString} copyText={copyText} raw={raw} inverted={inverted} />;
    }

    return <FullContent hexString={hexString} copyText={copyText} className={className} inverted={inverted} />;
}

const hexSpanVariants = cva('', {
    variants: {
        tone: {
            primary: 'e-text-white',
            secondary: 'e-text-gray-500',
            // Dashkit's text-gray-500 is rgb(171,213,198) — a teal-tinted gray.
            // Keep for backward compat until dashkit is fully removed.
            'secondary-old': 'e-text-[rgb(171,213,198)]',
        },
    },
});

function ColoredSpans({ spans }: { spans: HexSpan[] }) {
    return (
        <>
            {spans.map((span, i) => (
                <span key={i} className={hexSpanVariants({ tone: span.variant })}>
                    {span.text}{' '}
                </span>
            ))}
        </>
    );
}

function TruncatedContent({
    hexString,
    copyText,
    raw,
    inverted,
}: {
    hexString: string;
    copyText: string;
    raw: ByteArray;
    inverted: boolean;
}) {
    const { pairs: truncatedPairs, truncated } = truncateHexPairs(splitHexPairs(hexString));
    const spans = formatHexSpans(truncatedPairs, { inverted });

    return (
        <span className="e-inline-flex e-items-center e-gap-2 e-text-sm">
            <Copyable text={copyText}>
                <span className="e-font-mono e-text-xs">
                    <ColoredSpans spans={spans} />
                </span>
            </Copyable>
            {truncated && <span className="e-text-xs e-text-neutral-500">({raw.length} bytes)</span>}
        </span>
    );
}

function FullContent({
    hexString,
    copyText,
    className,
    inverted,
}: {
    hexString: string;
    copyText: string;
    className?: string;
    inverted: boolean;
}) {
    const spans = formatHexSpans(splitHexPairs(hexString), { inverted });
    const rows = groupHexRows(spans);

    const divs = rows.map((row, rowIdx) => (
        <div key={rowIdx}>
            {row.map((span, spanIdx) => (
                <span key={spanIdx} className={hexSpanVariants({ tone: span.variant })}>
                    {span.text}&emsp;
                </span>
            ))}
        </div>
    ));

    return (
        <>
            <div className={cn('e-hidden e-items-center e-justify-end lg:e-flex', className)}>
                <Copyable text={copyText}>
                    <pre className="e-mb-0 e-inline-block e-text-left">{divs}</pre>
                </Copyable>
            </div>
            <div className={cn('e-flex e-items-center lg:e-hidden', className)}>
                <Copyable text={copyText}>
                    <pre className="e-mb-0 e-inline-block e-text-left">{divs}</pre>
                </Copyable>
            </div>
        </>
    );
}
