'use client';

import { cn } from '@/app/components/shared/utils';

import { Region } from '../model/types';
import { chipClasses } from './palette';

type Props = {
    regions: Region[];
};

/**
 * Dedupes regions by `id` (some extensions emit multiple regions per instance,
 * e.g. MetadataPointer has 2 sub-regions under one header). The legend shows
 * the field name + a color chip keyed to the field's kind.
 *
 * MVP scope: hover tooltips only; no click-to-isolate interaction (per plan
 * simplification — isolate was flagged as adding state + race conditions for
 * marginal value).
 */
export function LayoutLegend({ regions }: Props) {
    const deduped = dedupeRegionsById(regions);
    if (deduped.length === 0) return null;
    return (
        <div
            data-testid="annotated-hex-legend"
            className="e-mt-3 e-flex e-flex-wrap e-gap-2 e-text-xs"
            aria-label="Field legend"
        >
            {deduped.map(region => (
                <span
                    key={region.id}
                    data-testid={`annotated-hex-legend-${region.id}`}
                    className={cn(
                        'e-inline-flex e-items-center e-gap-1 e-rounded e-border e-px-2 e-py-0.5 e-font-medium',
                        chipClasses(region.kind),
                    )}
                >
                    {region.name}
                </span>
            ))}
        </div>
    );
}

function dedupeRegionsById(regions: Region[]): Region[] {
    const seen = new Set<string>();
    const out: Region[] = [];
    for (const r of regions) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push(r);
    }
    return out;
}
