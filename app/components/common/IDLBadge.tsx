import { RootNode } from 'codama';
import React from 'react';

import { getIdlSpecType } from '@/app/utils/convertLegacyIdl';

interface IDLBadgeProps {
    idl: any;
    title: string;
}

export function IDLBadge({ idl, title }: IDLBadgeProps) {
    const version = getIdlVersion(idl);
    const badgeClass = version === 'Legacy' ? 'bg-warning' : 'bg-success';

    return (
        <span className={`badge ${badgeClass}`}>
            {version} {title}
        </span>
    );
}

export function getIdlVersion(idl: any): string {
    const spec = getIdlSpecType(idl);
    switch (spec) {
        case 'legacy':
            return 'Legacy';
        case 'codama':
            return (idl as RootNode).version;
        default:
            return '0.30.1';
    }
}
