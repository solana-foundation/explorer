'use client';

import { cva } from 'class-variance-authority';
import Link from 'next/link';
import React, { type ReactNode } from 'react';

import { AddressLink } from '@/app/components/shared/address';
import { Button } from '@/app/components/shared/ui/button';
import { cn } from '@/app/components/shared/utils';
import { Card, CardContent } from '@/app/shared/ui/Card';
import { SortIndicator } from '@/app/shared/ui/SortIndicator';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import type { ActivatedFeature, ClusterActivation, UpcomingFeature } from '../lib/partition-features';
import type { SortDirection } from '../lib/sort-activated-features';
import { ClusterEpoch } from './ClusterEpoch';
import { SimdLinks } from './SimdLinks';

export type FeatureRow = ActivatedFeature | UpcomingFeature;

type SecondColumn<T extends FeatureRow> = {
    header: ReactNode;
    /** Cell content for the column whose meaning differs between Activated / Upcoming. */
    render: (feature: T) => ReactNode;
    /** Makes the header a sort toggle showing `direction`; the caller owns the order of `features`. */
    sort?: { direction: SortDirection; onToggle: () => void };
};

export function FeatureGateTable<T extends FeatureRow>({
    features,
    cluster,
    secondColumn,
    emptyState,
    header,
    footer,
}: {
    features: T[];
    cluster: Cluster;
    secondColumn: SecondColumn<T>;
    /** Rendered in place of the table when `features` is empty. Without one an empty list renders nothing. */
    emptyState?: ReactNode;
    /** Optional content rendered above the table, inside the card. */
    header?: ReactNode;
    /** Optional content rendered below the rows, inside the card. */
    footer?: ReactNode;
}) {
    if (features.length === 0) return emptyState;

    return (
        <Card variant="tight" className={CARD_SURFACE}>
            {header}
            {/* Fixed track widths so the Upcoming and Activated tables and `UpcomingFeatures` align column for
                column; a stack of cards below `lg`, an ARIA grid from `lg`. */}
            <div
                role="table"
                className="flex w-full flex-col gap-2 text-sm text-white lg:grid lg:grid-cols-[minmax(0,1fr)_11rem_6.5rem_8.5rem] lg:gap-0"
            >
                <div role="row" className={rowVariants({ part: 'header' })}>
                    <div role="columnheader" className={cellVariants({ column: 'title', part: 'header' })}>
                        Feature
                    </div>
                    <div
                        role="columnheader"
                        aria-sort={secondColumn.sort && ARIA_SORT[secondColumn.sort.direction]}
                        className={cellVariants({ part: 'header' })}
                    >
                        {secondColumn.sort ? (
                            <button
                                type="button"
                                onClick={secondColumn.sort.onToggle}
                                className="inline-flex items-center gap-2 border-0 bg-transparent p-0 uppercase text-white"
                            >
                                {secondColumn.header}
                                <SortIndicator direction={secondColumn.sort.direction} />
                            </button>
                        ) : (
                            secondColumn.header
                        )}
                    </div>
                    <div role="columnheader" className={cellVariants({ part: 'header' })}>
                        SIMDs
                    </div>
                    <div role="columnheader" className={cellVariants({ part: 'header' })}>
                        Key
                    </div>
                </div>
                {features.map(feature => (
                    <FeatureRowView key={feature.key} feature={feature} cluster={cluster} secondColumn={secondColumn} />
                ))}
            </div>
            {footer}
        </Card>
    );
}

export function EmptyStateCard({ children }: { children: ReactNode }) {
    return (
        <Card variant="tight" className="overflow-hidden rounded-lg border-outer-space-800 bg-outer-space-900">
            <CardContent className="flex items-center justify-center px-6 py-6 text-center text-sm text-outer-space-300">
                {children}
            </CardContent>
        </Card>
    );
}

/** Footer that unfolds the rows a table holds back. */
export function ShowMoreButton({ hiddenCount, onClick }: { hiddenCount: number; onClick: () => void }) {
    return (
        // Below `lg` the button follows the cards with no frame to divide; from `lg` it closes the table.
        <div className="pt-2 lg:border-0 lg:border-t lg:border-solid lg:border-outer-space-800 lg:px-3 lg:py-2.5">
            <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
                Show {hiddenCount} more
            </Button>
        </div>
    );
}

/** The epochs a feature activated at on the other clusters: the cluster muted, its epoch a link. */
export function OtherActivationsCell({ activations }: { activations: ClusterActivation[] }) {
    // No wrapper when empty, so the cell's `empty:hidden` drops the gap on the mobile card, as `SimdLinks` does.
    if (activations.length === 0) return undefined;
    return (
        // In a line on the mobile card, one cluster per line in the desktop column.
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 whitespace-nowrap lg:flex-col">
            {activations.map(({ cluster, epoch }) => (
                <ClusterEpoch key={cluster} cluster={cluster} epoch={epoch} />
            ))}
        </div>
    );
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

// Lifts a mobile card's own links (epochs, SIMDs) above the title's stretched link.
// The config has no `max-lg` screen, so the card styles are the base and `lg:` undoes them.
const CARD_CONTROL = 'relative z-10 lg:static lg:z-auto';

// The key only tells features apart and gets copied; all 44 characters would stretch the Key column past
// the page width, so it reads head…tail. The full key stays in the link's tooltip and in the copy button.
const KEY_TRUNCATE = { head: 4, tail: 4 };

// Surface matched to `BaseDomainsCard` from `lg`; below it the cards are the surface, so the frame drops away.
// BaseCard uses `cnPrefixed` (tailwind-merge), so these override the tw variant's defaults.
const CARD_SURFACE =
    'overflow-hidden rounded-lg border-0 bg-transparent lg:border lg:border-solid lg:border-outer-space-800 lg:bg-outer-space-900';

// Below `lg` a body row is a card whose values wrap: the SIMDs open it, the title cell takes a whole line, the
// epochs follow on the next. From `lg` every row spans the grid and lays its cells on the parent's columns through
// `subgrid`.
const rowVariants = cva('', {
    variants: {
        // `part`, not `role`: these elements already carry the ARIA `role` attribute, so the word is kept for that.
        part: {
            body: cn(
                'relative flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-solid border-outer-space-800 bg-outer-space-900 p-3',
                'lg:col-span-full lg:grid lg:grid-cols-subgrid lg:gap-0 lg:rounded-none lg:border-0 lg:border-t lg:bg-transparent lg:p-0',
            ),
            header: 'hidden lg:col-span-full lg:grid lg:grid-cols-subgrid',
        },
    },
});

// Cell paddings apply from `lg` only; below it the card owns the padding. The non-title cells start a little
// lower than the title so their first line sits level with it.
const cellVariants = cva('min-w-0', {
    compoundVariants: [
        { class: 'flex-col items-start', column: ['title', 'activation', 'simd', 'key'], part: 'body' },
        // Match the Key column's type size so the epoch and key read alike.
        { class: 'text-dk-sm', column: 'activation', part: 'body' },
        { class: 'lg:py-3.5', column: 'title', part: 'body' },
        { class: 'lg:pb-3.5 lg:pt-4', column: ['activation', 'simd', 'key'], part: 'body' },
    ],
    defaultVariants: { column: 'activation', part: 'body' },
    variants: {
        column: {
            // The Activation column. Empty for an upcoming feature with no activations elsewhere: no gap on the
            // wrapped card, holds its column from `lg`.
            activation: cn('flex empty:hidden lg:px-3 lg:empty:flex', CARD_CONTROL),
            // The key is left to the feature's page on mobile.
            key: 'hidden lg:flex lg:px-3',
            // The SIMDs head the mobile card; the full-width title after them starts the next line. Empty for a
            // feature with no SIMDs: no gap on the wrapped card, holds its column from `lg`.
            simd: cn('order-first flex empty:hidden lg:order-none lg:px-3 lg:empty:flex', CARD_CONTROL),
            title: 'flex w-full [overflow-wrap:anywhere] lg:w-auto lg:px-3',
        },
        // `part`, not `role`: these elements already carry the ARIA `role` attribute, so the word is kept for that.
        part: {
            body: '',
            header: 'items-center whitespace-nowrap py-2.5 text-xs uppercase text-outer-space-300',
        },
    },
});

function FeatureRowView<T extends FeatureRow>({
    feature,
    cluster,
    secondColumn,
}: {
    feature: T;
    cluster: Cluster;
    secondColumn: SecondColumn<T>;
}) {
    return (
        <div role="row" className={rowVariants({ part: 'body' })}>
            <div role="cell" className={cellVariants({ column: 'title' })}>
                {/* The token-extensions name: 16px on a 24px line, regular weight. Below `lg` the link stretches over
                    its card through `::after`, so a tap anywhere on the card opens the feature; the other links in
                    the card sit above that layer (`CARD_CONTROL`) and keep their own targets. */}
                <Link
                    href={`/address/${feature.key}/feature-gate?cluster=${clusterSlug(cluster)}`}
                    className="text-base leading-6 text-white after:absolute after:inset-0 after:content-[''] hover:text-dark-accent hover:underline lg:after:content-none"
                >
                    {feature.title}
                </Link>
                {feature.description && (
                    <p className="m-0 mt-0.5 max-w-[640px] text-sm text-outer-space-300">{feature.description}</p>
                )}
            </div>
            <div role="cell" className={cellVariants()}>
                {secondColumn.render(feature)}
            </div>
            <div role="cell" className={cellVariants({ column: 'simd' })}>
                <SimdLinks entries={feature.simdEntries} layout="stack" />
            </div>
            <div role="cell" className={cellVariants({ column: 'key' })}>
                <AddressLink address={feature.key} truncate={KEY_TRUNCATE} />
            </div>
        </div>
    );
}
