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
 * Layout matches the original HexData block: right-aligned content within
 * the table cell, no separate offset column (the tooltip carries per-byte
 * offset metadata).
 *
 * This component is account-agnostic — see AccountAnnotatedHex for the
 * adapter that pulls regions from the account hook.
 */
export function AnnotatedHexData({ raw, regions }: Props) {
    const offsetMap = useMemo(() => buildOffsetMap(raw.length, regions), [raw.length, regions]);
    const regionIndexById = useMemo(() => buildRegionIndexById(regions), [regions]);
    const regionStartOffsets = useMemo(() => new Set(regions.map(r => r.start)), [regions]);

    const rows = useMemo(() => {
        const result: { offset: number; bytes: Uint8Array }[] = [];
        for (let i = 0; i < raw.length; i += ROW_SIZE) {
            result.push({ bytes: raw.slice(i, Math.min(i + ROW_SIZE, raw.length)), offset: i });
        }
        return result;
    }, [raw]);

    return (
        <TooltipProvider delayDuration={200} skipDelayDuration={400} disableHoverableContent>
            <div className="e-flex e-flex-col e-items-end e-gap-3">
                <div
                    role="grid"
                    aria-label="Account hex dump"
                    aria-rowcount={rows.length}
                    aria-colcount={ROW_SIZE}
                    className="e-inline-block e-font-mono e-text-xs e-leading-tight"
                    data-testid="annotated-hex-grid"
                >
                    {rows.map(row => (
                        <div
                            key={row.offset}
                            role="row"
                            className="e-flex e-justify-end e-gap-px e-py-px"
                        >
                            {Array.from(row.bytes).map((byte, colIdx) => {
                                const offset = row.offset + colIdx;
                                const region = offsetMap[offset];
                                const rotationIndex = region ? regionIndexById.get(region.id) ?? 0 : 0;
                                return (
                                    <AnnotatedHexCell
                                        key={offset}
                                        byte={byte}
                                        offset={offset}
                                        region={region}
                                        rotationIndex={rotationIndex}
                                        isRegionStart={region !== undefined && regionStartOffsets.has(offset)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
                <LayoutLegend regions={regions} />
            </div>
        </TooltipProvider>
    );
}

type CellProps = {
    byte: number;
    offset: number;
    region: Region | undefined;
    rotationIndex: number;
    isRegionStart: boolean;
};

function AnnotatedHexCell({ byte, offset, region, rotationIndex, isRegionStart }: CellProps) {
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
                        cellClasses(region.kind, rotationIndex),
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
                <span data-testid="decoded-pubkey-none" className="e-italic e-text-neutral-400">
                    None
                </span>
            ) : (
                <code data-testid="decoded-pubkey" className="e-font-mono">
                    {value.base58}
                </code>
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

/**
 * Map each region id to its index in the regions array. Used by the palette
 * rotation so every distinct region gets a distinct color (or as close to it
 * as the rotation size allows). Duplicate region ids share a color — this
 * matches the legend's dedupe behavior.
 */
function buildRegionIndexById(regions: Region[]): Map<string, number> {
    const map = new Map<string, number>();
    regions.forEach((r, idx) => {
        if (!map.has(r.id)) map.set(r.id, idx);
    });
    return map;
}
