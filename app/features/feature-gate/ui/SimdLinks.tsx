import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';

import type { SimdEntry } from '../lib/partition-features';

export function SimdLinks({ entries }: { entries: SimdEntry[] }) {
    if (entries.length === 0) return undefined;
    return (
        <div className="e-flex e-flex-wrap e-gap-1">
            {entries.map(({ simd, link }, index) => (
                <Badge key={`${simd}-${index}`} as="link" size="xs" variant="info" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        SIMD {simd.padStart(4, '0')}
                    </a>
                </Badge>
            ))}
        </div>
    );
}
