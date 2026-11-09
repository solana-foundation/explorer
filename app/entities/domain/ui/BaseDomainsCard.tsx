'use client';

import { Address } from '@components/common/Address';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { DomainInfo } from '../model/types';

type ValidDomain = DomainInfo & { pubkey: PublicKey };

// Domain column sizing — responsive, no JS. The account column always keeps the rest (`1fr`).
// - Mobile (below `md`): content-aware within a px band. `fit-content(clamp(200px,50%,400px))` is the
//   ceiling; the `min-w-[clamp(120px,25%,240px)]` cell floor feeds its minimum so short names rest at the
//   ~25% band, long ones grow to the 50% band then wrap (`break-all`).
// - md+: a fixed 25% band `clamp(120px,25%,240px)`; the spaceless name wraps inside it.
const GRID_TEMPLATE = 'grid-cols-[fit-content(clamp(200px,50%,400px))_1fr] md:grid-cols-[clamp(120px,25%,240px)_1fr]';

const COLUMNS: ReadonlyArray<GridTableColumn<ValidDomain>> = [
    {
        // A domain name is one spaceless token, so `break-all` is what lets it wrap; `min-w` sets the
        // mobile floor and matches the md+ track width.
        cellClassName: 'min-w-[clamp(120px,25%,240px)] break-all',
        header: 'Domain',
        render: domain => domain.name,
    },
    {
        cellClassName: 'min-w-0 whitespace-nowrap',
        header: 'Name Service Account',
        render: domain => <Address pubkey={domain.pubkey} link />,
    },
];

export function BaseDomainsCard({ domains }: { domains: DomainInfo[] }) {
    const validDomains = useMemo(
        () =>
            domains
                .map(domain => ({ ...domain, pubkey: tryPublicKey(domain.address) }))
                .filter((d): d is ValidDomain => d.pubkey !== null),
        [domains],
    );

    return (
        <GridTableCard
            title="Owned Domain Names"
            ariaLabel="Owned domain names"
            gridTemplate={GRID_TEMPLATE}
            columns={COLUMNS}
            rows={validDomains}
            getRowKey={domain => domain.address}
        />
    );
}

function tryPublicKey(address: string): PublicKey | null {
    try {
        return new PublicKey(address);
    } catch {
        return null;
    }
}
