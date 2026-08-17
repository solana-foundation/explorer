import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { ExternalLink } from '@/app/components/shared/ui/external-link';

import type { SimdEntry } from '../lib/partition-features';

export function SimdLinks({ entries }: { entries: SimdEntry[] }) {
    if (entries.length === 0) return undefined;
    return (
        <div className="flex flex-wrap gap-1">
            {entries.map(({ simd, link }, index) => (
                <Badge key={`${simd}-${index}`} as="link" size="xs" variant="info" asChild>
                    <ExternalLink href={link}>SIMD {simd.padStart(4, '0')}</ExternalLink>
                </Badge>
            ))}
        </div>
    );
}
