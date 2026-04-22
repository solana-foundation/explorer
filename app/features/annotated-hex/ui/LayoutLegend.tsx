'use client';

import { cn } from '@/app/components/shared/utils';

import { Region } from '../model/types';
import { chipClasses } from './palette';

type Props = {
    regions: Region[];
};

/**
 * Dedupes regions by `id` (some extensions emit multiple regions per instance).
 * Each unique region renders as a color chip with its field name; chip color
 * matches the cell color via the shared rotation index.
 *
 * Hover tooltips remain the primary interaction. MVP keeps this static — no
 * click-to-isolate. (See brainstorm: simplification call.)
 */
export function LayoutLegend({ regions }: Props) {
    const deduped = dedupeRegionsById(regions);
    if (deduped.length === 0) return null;
    return (
        <div
            data-testid="annotated-hex-legend"
            className="e-mt-3 e-flex e-flex-wrap e-justify-end e-gap-2 e-text-xs"
            aria-label="Field legend"
        >
            {deduped.map(({ region, rotationIndex }) => (
                <span
                    key={region.id}
                    data-testid={`annotated-hex-legend-${region.id}`}
                    className={cn(
                        'e-inline-flex e-items-center e-gap-1 e-rounded e-border e-px-2 e-py-0.5 e-font-medium',
                        chipClasses(region.kind, rotationIndex),
                    )}
                >
                    {region.name}
                </span>
            ))}
        </div>
    );
}

function dedupeRegionsById(regions: Region[]): { region: Region; rotationIndex: number }[] {
    const seen = new Map<string, number>();
    const out: { region: Region; rotationIndex: number }[] = [];
    regions.forEach((r, idx) => {
        if (seen.has(r.id)) return;
        seen.set(r.id, idx);
        out.push({ region: r, rotationIndex: idx });
    });
    return out;
}
