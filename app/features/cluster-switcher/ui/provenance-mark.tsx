'use client';

import { AlertTriangle, CheckCircle } from 'react-feather';

import type { EndpointProvenance } from '../lib/endpoint-provenance';

export const KNOWN_COLOUR = '#1dd79b';
export const UNKNOWN_COLOUR = '#e08214';

const MARK_LABEL_CLASSES = 'text-[10px] font-medium uppercase tracking-[0.12em]';

type MarkStyle = { colour: string; glyph: typeof CheckCircle; label: string; title: string };

export const PROVENANCE_MARK: Record<EndpointProvenance, MarkStyle | undefined> = {
    known: {
        colour: KNOWN_COLOUR,
        glyph: CheckCircle,
        label: 'known',
        title: 'A known endpoint — one this deployment ships with or vouches for',
    },
    local: undefined,
    unknown: {
        colour: UNKNOWN_COLOUR,
        glyph: AlertTriangle,
        label: 'unknown',
        title: 'Nobody has vouched for this endpoint',
    },
};

export function ProvenanceMark({
    provenance,
    size = 12,
    title,
    withLabel,
}: {
    provenance: EndpointProvenance | undefined;
    size?: number;
    title?: string;
    withLabel?: boolean;
}) {
    const mark = provenance ? PROVENANCE_MARK[provenance] : undefined;
    if (mark === undefined) return undefined;
    const Glyph = mark.glyph;
    return (
        <span
            aria-hidden
            className="flex shrink-0 items-center gap-1"
            style={{ color: mark.colour }}
            title={title ?? mark.title}
        >
            <Glyph size={size} />
            {withLabel && <span className={MARK_LABEL_CLASSES}>{mark.label}</span>}
        </span>
    );
}

export function KnownMark({ size, title, withLabel }: { size?: number; title?: string; withLabel?: boolean }) {
    return <ProvenanceMark provenance="known" size={size} title={title} withLabel={withLabel} />;
}
