'use client';

import { Address } from '@components/common/Address';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cn } from '@components/shared/utils';
import { PublicKey } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { Card } from '@/app/shared/ui/Card';

import { DomainInfo } from '../model/types';

type ValidDomain = DomainInfo & { pubkey: PublicKey };

// Column labels, kept in one place so header copy can't drift from the rows below.
const COLUMNS = ['Domain', 'Name Service Account'] as const;

// The card is a collapsible section (heading lifted out above the surface + chevron toggle + the
// `1fr`/`0fr` height animation), provided by the shared `CollapsibleSection`. `className=""` keeps its
// inner wrapper bare so the surface comes from the `<Card>` below (same pattern the transaction
// `InstructionsSection` uses).
//
// The domain list is a CSS-grid built from `div`s (see `DomainsGrid`), mirroring the transaction
// page's Accounts/Token Balances tables.
export function BaseDomainsCard({ domains }: { domains: DomainInfo[] }) {
    const validDomains = useMemo(
        () =>
            domains
                .map(domain => ({ ...domain, pubkey: tryPublicKey(domain.address) }))
                .filter((d): d is ValidDomain => d.pubkey !== null),
        [domains],
    );

    return (
        <CollapsibleSection title="Owned Domain Names" className="">
            {/* Surface matched to the transaction Tokens/Accounts card, in pure Tailwind: bg
                `outer-space-900` equals `#1e2423` (dashkit `dk-gray-800-dark`); `border-outer-space-800`
                gives the card the same tone as the row separators; `rounded-lg` is the 8px radius.
                BaseCard uses `cnPrefixed` (tailwind-merge), so these override the tw variant's defaults. */}
            <Card variant="tight" className="rounded-lg border-outer-space-800 bg-outer-space-900">
                <DomainsGrid domains={validDomains} />
            </Card>
        </CollapsibleSection>
    );
}

// CSS-grid layout — a single 2-column grid so columns stay aligned across header and rows the way a
// `<table>`'s shared columns do. Pure Tailwind, matching the transaction page's Accounts/Token Balances
// tables: muted uppercase `text-xs` header, `text-sm` body, `outer-space-800` row separators (same tone
// as the card border), transparent (card-matching) background, 10px/12px padding.
//
// Domain column sizing — responsive, no JS. The account column always keeps the rest (`1fr`).
// - Mobile (xs, sm — below `md`): content-aware within a px band. `fit-content(clamp(200px,50%,400px))`
//   is the *ceiling* — the column grows with the domain content up to a 50% band (px-clamped 200–400),
//   then the name wraps (`break-all`). `min-w-[clamp(120px,25%,200px)]` on the body cell is the *floor*,
//   feeding `fit-content`'s minimum so short names rest at the ~25% band (px-clamped 120–240).
// - Tablet (md, lg) + desktop (xl, xxl): a fixed 25% band `clamp(120px,25%,240px)` — no content growth;
//   the name wraps (`break-all`) inside it. Both tiers match, so one `md:` rule covers md→xxl; split it
//   out (add an `xl:` variant) if desktop ever needs to diverge.
const GRID_HEADER_CELL = 'flex items-center whitespace-nowrap px-3 py-2.5 text-xs uppercase text-outer-space-300';
// Shared body-cell styling. `min-width` is set per cell below (a floor on the name, `0` on the account)
// so it isn't baked in here — `cn` is clsx, so a base `min-w-*` couldn't be overridden per cell.
const GRID_BODY_CELL = 'flex items-start border-t border-solid border-outer-space-800 px-3 py-2.5';
const GRID_DOMAIN_FLOOR = 'min-w-[clamp(120px,25%,240px)]';

function DomainsGrid({ domains }: { domains: ValidDomain[] }) {
    return (
        <div className="w-full overflow-x-auto text-sm text-white">
            <div className="grid min-w-full grid-cols-[fit-content(clamp(200px,50%,400px))_1fr] md:grid-cols-[clamp(120px,25%,240px)_1fr]">
                {COLUMNS.map(label => (
                    <div key={label} className={GRID_HEADER_CELL}>
                        {label}
                    </div>
                ))}
                {domains.map(domain => (
                    <React.Fragment key={domain.address}>
                        {/* A domain name is a single spaceless token, so `break-all` is what lets it wrap —
                            on mobile once the column hits its `fit-content` ceiling, on md+ inside the fixed
                            25% track. `min-w` sets the mobile floor (and matches the md+ track width). */}
                        <div className={cn(GRID_BODY_CELL, GRID_DOMAIN_FLOOR, 'break-all')}>{domain.name}</div>
                        <div className={cn(GRID_BODY_CELL, 'min-w-0 whitespace-nowrap')}>
                            <Address pubkey={domain.pubkey} link />
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

function tryPublicKey(address: string): PublicKey | null {
    try {
        return new PublicKey(address);
    } catch {
        return null;
    }
}
