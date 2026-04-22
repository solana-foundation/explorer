'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/shared/ui/tooltip';
import { useMemo } from 'react';

import { cn } from '@/app/components/shared/utils';

import { DecodedValue, Region } from '../model/types';
import { LayoutLegend } from './LayoutLegend';
import { cellClasses } from './palette';

const ROW_SIZE = 16;

type Props = {
    raw: Uint8Array;
    regions: Region[];
};

/**
 * Presentational primitive: given raw bytes + a region map, renders a hex
 * dump where each byte is colored by the field it belongs to and a Radix
 * Tooltip reveals the field name + decoded value on hover/focus.
 *
 * Uses WAI-ARIA's Grid Pattern (role=grid / row / gridcell) with a simple
 * per-region tab stop (the first cell of each region is tabIndex=0, all
 * others are -1). Tab moves user from one region to the next; Tab exits
 * the grid. Full arrow-key navigation within a region is left for a
 * follow-up — the MVP prioritizes legibility + tooltip access.
 *
 * This component is account-agnostic — see AccountAnnotatedHex for the
 * adapter that pulls regions from the account hook.
 */
export function AnnotatedHexData({ raw, regions }: Props) {
    const offsetMap = useMemo(() => buildOffsetMap(raw.length, regions), [raw.length, regions]);
    const regionStartOffsets = useMemo(() => new Set(regions.map(r => r.start)), [regions]);

    const rows = useMemo(() => {
        const result: { offset: number; bytes: Uint8Array }[] = [];
        for (let i = 0; i < raw.length; i += ROW_SIZE) {
            result.push({ offset: i, bytes: raw.slice(i, Math.min(i + ROW_SIZE, raw.length)) });
        }
        return result;
    }, [raw]);

    return (
        <TooltipProvider delayDuration={200} skipDelayDuration={400} disableHoverableContent>
            <div
                role="grid"
                aria-label="Account hex dump"
                aria-rowcount={rows.length}
                aria-colcount={ROW_SIZE}
                className="e-font-mono e-text-xs e-leading-tight"
                data-testid="annotated-hex-grid"
            >
                {rows.map(row => (
                    <div
                        key={row.offset}
                        role="row"
                        className="e-flex e-items-center e-gap-1 e-py-px"
                    >
                        <span
                            aria-hidden
                            className="e-w-12 e-flex-shrink-0 e-text-right e-text-neutral-500"
                        >
                            {row.offset.toString(16).padStart(4, '0')}
                        </span>
                        <div className="e-flex e-gap-px">
                            {Array.from(row.bytes).map((byte, colIdx) => {
                                const offset = row.offset + colIdx;
                                const region = offsetMap[offset];
                                return (
                                    <AnnotatedHexCell
                                        key={offset}
                                        byte={byte}
                                        offset={offset}
                                        region={region}
                                        isRegionStart={region !== undefined && regionStartOffsets.has(offset)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <LayoutLegend regions={regions} />
        </TooltipProvider>
    );
}

type CellProps = {
    byte: number;
    offset: number;
    region: Region | undefined;
    isRegionStart: boolean;
};

function AnnotatedHexCell({ byte, offset, region, isRegionStart }: CellProps) {
    const hex = byte.toString(16).padStart(2, '0');

    if (!region) {
        return (
            <span
                role="gridcell"
                data-testid={`annotated-cell-${offset}`}
                className="e-px-1 e-py-0.5 e-text-neutral-500"
            >
                {hex}
            </span>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    role="gridcell"
                    tabIndex={isRegionStart ? 0 : -1}
                    data-testid={`annotated-cell-${offset}`}
                    data-region-id={region.id}
                    aria-label={`${region.name}, byte ${offset}`}
                    className={cn(
                        'e-rounded-[2px] e-px-1 e-py-0.5 e-cursor-help e-outline-none',
                        'focus-visible:e-ring-2 focus-visible:e-ring-white/40',
                        cellClasses(region.kind),
                    )}
                >
                    {hex}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="e-max-w-sm e-break-words">
                <TooltipBody region={region} offset={offset} byte={byte} />
            </TooltipContent>
        </Tooltip>
    );
}

export function TooltipBody({ region, offset, byte }: { region: Region; offset: number; byte: number }) {
    return (
        <div
            data-testid={`annotated-tooltip-${region.id}`}
            className="e-flex e-flex-col e-gap-0.5 e-text-xs"
        >
            <div className="e-font-semibold e-text-neutral-50 dark:e-text-neutral-900">{region.name}</div>
            <div className="e-text-neutral-200 dark:e-text-neutral-700">
                <RenderDecodedValue value={region.decodedValue} />
            </div>
            <div className="e-mt-1 e-text-[10px] e-text-neutral-400 dark:e-text-neutral-600">
                bytes [{region.start}..{region.start + region.length}] · offset 0x
                {offset.toString(16).padStart(4, '0')} · byte 0x{byte.toString(16).padStart(2, '0')}
            </div>
        </div>
    );
}

function RenderDecodedValue({ value }: { value: DecodedValue }) {
    switch (value.kind) {
        case 'pubkey':
            return value.isNone ? (
                <span className="e-italic e-text-neutral-400">None</span>
            ) : (
                <code className="e-font-mono">{value.base58}</code>
            );
        case 'amount': {
            const raw = value.raw.toString();
            if (value.decimals != null) {
                // Show both raw and ui-scaled — never silently apply decimals
                const div = 10n ** BigInt(value.decimals);
                const whole = value.raw / div;
                const frac = (value.raw % div).toString().padStart(value.decimals, '0');
                return (
                    <span>
                        <code className="e-font-mono">{raw}</code>{' '}
                        <span className="e-text-neutral-400">
                            ({whole.toString()}.{frac} with {value.decimals} decimals)
                        </span>
                    </span>
                );
            }
            return <code className="e-font-mono">{raw}</code>;
        }
        case 'scalar':
            return (
                <span>
                    <code className="e-font-mono">{String(value.value)}</code>
                    {value.label && <span className="e-text-neutral-400"> ({value.label})</span>}
                </span>
            );
        case 'option':
            return <span>{value.present ? 'Some' : 'None'}</span>;
        case 'text':
            // React auto-escapes text children; value has already been sanitized by sanitizeDisplayString
            // in the decoder path, so bidi overrides / control chars / overlong strings are already neutralized.
            return <span className="e-break-words">{value.value}</span>;
        case 'unparsed':
            return <span className="e-italic e-text-neutral-400">(unparsed: {value.reason})</span>;
    }
}

/**
 * Build a dense offset→Region lookup for O(1) per-cell color resolution.
 *
 * Uses a flat array (not a Map) because offsets are contiguous 0..length and
 * array indexing beats Map.get() by ~2x at these sizes — matters when
 * rendering a 300-cell Token-2022 account at 60fps during hover.
 */
function buildOffsetMap(size: number, regions: Region[]): (Region | undefined)[] {
    const map = new Array<Region | undefined>(size);
    for (const r of regions) {
        for (let i = 0; i < r.length; i++) {
            const offset = r.start + i;
            if (offset < size) map[offset] = r;
        }
    }
    return map;
}
