import { cva } from 'class-variance-authority';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { ExternalLink } from '@/app/components/shared/ui/external-link';

import type { SimdEntry } from '../lib/partition-features';

const simdLinksVariants = cva('flex gap-1', {
    defaultVariants: { layout: 'wrap' },
    variants: {
        layout: {
            stack: 'flex-wrap lg:flex-col lg:items-start',
            wrap: 'flex-wrap',
        },
    },
});

export function SimdLinks({ entries, layout }: { entries: SimdEntry[]; layout?: 'stack' | 'wrap' }) {
    if (entries.length === 0) return undefined;
    return (
        <div className={simdLinksVariants({ layout })}>
            {entries.map(({ simd, link }, index) => (
                <Badge key={`${simd}-${index}`} variant="info" asChild>
                    <ExternalLink href={link}>SIMD {simd.padStart(4, '0')}</ExternalLink>
                </Badge>
            ))}
        </div>
    );
}
