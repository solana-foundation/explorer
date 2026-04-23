'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/shared/ui/tooltip';
import { cn } from '@shared/utils';
import { useMemo } from 'react';

import { DecodedValue, Region } from '../model/types';
import { LayoutLegend } from './LayoutLegend';
import { cellClasses } from './palette';

const ROW_SIZE = 16;

type Props = {
    raw: Uint8Array;
    regions: Region[];
};

export function AnnotatedHexData({ raw, regions }: Props) {
    const { offsetMap, regionIndexById } = useMemo(() => {
        const offsets = new Array<Region | undefined>(raw.length);
        const indexById = new Map<string, number>();
        regions.forEach((r, idx) => {
            if (!indexById.has(r.id)) indexById.set(r.id, idx);
            for (let i = 0; i < r.length; i++) {
                const offset = r.start + i;
                if (offset < raw.length) offsets[offset] = r;
            }
        });
        return { offsetMap: offsets, regionIndexById: indexById };
    }, [raw.length, regions]);

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
                        <Row
                            key={row.offset}
                            rowOffset={row.offset}
                            rowBytes={row.bytes}
                            offsetMap={offsetMap}
                            regionIndexById={regionIndexById}
                        />
                    ))}
                </div>
                <LayoutLegend regions={regions} />
            </div>
        </TooltipProvider>
    );
}

type Segment = {
    startOffset: number;
    bytes: Uint8Array;
    region: Region | undefined;
};

function Row({
    rowOffset,
    rowBytes,
    offsetMap,
    regionIndexById,
}: {
    rowOffset: number;
    rowBytes: Uint8Array;
    offsetMap: readonly (Region | undefined)[];
    regionIndexById: ReadonlyMap<string, number>;
}) {
    const segments: Segment[] = [];
    for (let i = 0; i < rowBytes.length; i++) {
        const offset = rowOffset + i;
        const region = offsetMap[offset];
        const last = segments[segments.length - 1];
        if (last && last.region === region) {
            last.bytes = concat(last.bytes, rowBytes[i]);
        } else {
            segments.push({ bytes: Uint8Array.of(rowBytes[i]), region, startOffset: offset });
        }
    }

    return (
        <div role="row" className="e-flex e-justify-end e-gap-px e-py-px">
            {segments.map(segment =>
                segment.region ? (
                    <RegionSegment
                        key={segment.startOffset}
                        segment={segment}
                        region={segment.region}
                        rotationIndex={regionIndexById.get(segment.region.id) ?? 0}
                    />
                ) : (
                    <UnannotatedSegment key={segment.startOffset} segment={segment} />
                ),
            )}
        </div>
    );
}

function RegionSegment({
    segment,
    region,
    rotationIndex,
}: {
    segment: Segment;
    region: Region;
    rotationIndex: number;
}) {
    const isRegionStart = segment.startOffset === region.start;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    data-testid={`annotated-segment-${segment.startOffset}`}
                    data-region-id={region.id}
                    tabIndex={isRegionStart ? 0 : -1}
                    aria-label={region.name}
                    className={cn(
                        'e-inline-flex e-gap-px e-rounded-[2px] e-cursor-help e-outline-none',
                        'focus-visible:e-ring-2 focus-visible:e-ring-white/40',
                        cellClasses(region.kind, rotationIndex),
                    )}
                >
                    {Array.from(segment.bytes).map((byte, i) => (
                        <Cell
                            key={segment.startOffset + i}
                            offset={segment.startOffset + i}
                            byte={byte}
                            regionId={region.id}
                        />
                    ))}
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="e-max-w-sm e-break-words">
                <TooltipBody region={region} />
            </TooltipContent>
        </Tooltip>
    );
}

function UnannotatedSegment({ segment }: { segment: Segment }) {
    return (
        <span className="e-inline-flex e-gap-px e-text-neutral-500">
            {Array.from(segment.bytes).map((byte, i) => (
                <Cell key={segment.startOffset + i} offset={segment.startOffset + i} byte={byte} />
            ))}
        </span>
    );
}

function Cell({ offset, byte, regionId }: { offset: number; byte: number; regionId?: string }) {
    return (
        <span
            role="gridcell"
            data-testid={`annotated-cell-${offset}`}
            data-region-id={regionId}
            className="e-px-1 e-py-0.5"
        >
            {byte.toString(16).padStart(2, '0')}
        </span>
    );
}

export function TooltipBody({ region }: { region: Region }) {
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
                bytes [{region.start}..{region.start + region.length}] · {region.length} byte
                {region.length === 1 ? '' : 's'}
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
            return <span className="e-break-words">{value.value}</span>;
        case 'unparsed':
            return <span className="e-italic e-text-neutral-400">(unparsed: {value.reason})</span>;
    }
}

function concat(prev: Uint8Array, byte: number): Uint8Array {
    const out = new Uint8Array(prev.length + 1);
    out.set(prev, 0);
    out[prev.length] = byte;
    return out;
}
