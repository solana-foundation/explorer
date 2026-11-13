'use client';

import { useSlotTime } from '@entities/slot-time';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { CollapsibleSection } from '@/app/components/shared/ui/collapsible-section';
import { useCluster, useClusterInfo } from '@/app/providers/cluster';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { PageHeader, PageLayout, PageSections } from '@/app/shared/ui/page-layout';
import { Cluster, clusterName } from '@/app/utils/cluster';

import { estimateTimeUntilEpoch } from '../lib/epoch-countdown';
import { type ActivatedFeature, partitionFeatures, type UpcomingFeature } from '../lib/partition-features';
import { previewUpcomingFeatures } from '../lib/preview-upcoming-features';
import {
    DEFAULT_SORT_DIRECTION,
    isSortDirection,
    sortActivatedFeatures,
    type SortDirection,
} from '../lib/sort-activated-features';
import { ClusterEpoch } from './ClusterEpoch';
import { EmptyStateCard, FeatureGateTable, OtherActivationsCell, ShowMoreButton } from './FeatureGateTable';

// The room under the last section, as the transaction page leaves under its instructions (`pb-10`).
const PAGE_BOTTOM = 'pb-10';

/** URL param holding the Activated sort direction, as `BlockHistoryCard` keeps its sort in `dir`. */
const SORT_PARAM = 'dir';

// Bottom-aligns the title with its count and the collapse toggle, as in `BlockHistoryCard`.
const SECTION_TITLE_CLASS_NAME = 'items-end gap-4';

/** Everything a countdown needs but the target epoch. Absent until the whole set is in hand. */
type CountdownInput = {
    currentEpoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
    slotsPerEpoch: bigint;
    msPerSlot: number;
};

export function FeatureGatesView() {
    const { cluster } = useCluster();
    const clusterInfo = useClusterInfo({ enabled: cluster !== Cluster.Custom });
    // A custom cluster gets no table below, so its rate would be measured at the visitor's own node for
    // a countdown nothing renders.
    const msPerSlot = useSlotTime({ enabled: cluster !== Cluster.Custom });
    const { activated, upcoming } = useMemo(() => partitionFeatures(cluster), [cluster]);
    const [showAllUpcoming, setShowAllUpcoming] = useState(false);
    // Each cluster's Upcoming list opens folded; without this a switch after "Show more" keeps the next one open.
    useEffect(() => setShowAllUpcoming(false), [cluster]);
    const [sortDirection, toggleSortDirection] = useSortDirection();
    const sortedActivated = useMemo(() => sortActivatedFeatures(activated, sortDirection), [activated, sortDirection]);

    if (cluster === Cluster.Custom) {
        return (
            <PageLayout className={PAGE_BOTTOM}>
                <PageHeader title="Feature Gates" />
                <Card variant="tight" className="rounded-lg border-outer-space-800 bg-outer-space-900">
                    <CardHeader>
                        <CardTitle>Custom cluster</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-dark-foreground">
                        Enumeration of feature gates is not available on a custom cluster.
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    const countdownInput: CountdownInput | undefined =
        clusterInfo && msPerSlot !== undefined
            ? {
                  currentEpoch: clusterInfo.epochInfo.epoch,
                  msPerSlot,
                  slotIndex: clusterInfo.epochInfo.slotIndex,
                  slotsInEpoch: clusterInfo.epochInfo.slotsInEpoch,
                  slotsPerEpoch: clusterInfo.epochSchedule.slotsPerEpoch,
              }
            : undefined;

    const { visible: visibleUpcoming, hiddenCount } = previewUpcomingFeatures(upcoming, showAllUpcoming);
    // A section with nothing to show is left out. When every one is, a single line says so instead of a blank page.
    const nothingToShow = upcoming.length + sortedActivated.length === 0;
    const upcomingFooter = hiddenCount > 0 && (
        <ShowMoreButton hiddenCount={hiddenCount} onClick={() => setShowAllUpcoming(true)} />
    );

    return (
        <PageLayout className={PAGE_BOTTOM}>
            <PageHeader eyebrow={clusterName(cluster)} title="Feature Gates" />

            <PageSections>
                {nothingToShow && <EmptyStateCard>No feature gates on {clusterName(cluster)}.</EmptyStateCard>}
                {upcoming.length === 0 && cluster === Cluster.Testnet && !nothingToShow && (
                    <p className="m-0 text-sm text-outer-space-300">
                        New features activate on testnet first, so this list is usually empty here.
                    </p>
                )}
                {upcoming.length > 0 && (
                    <CollapsibleSection
                        title={<SectionTitle count={upcoming.length}>Upcoming</SectionTitle>}
                        titleClassName={SECTION_TITLE_CLASS_NAME}
                        className=""
                    >
                        <FeatureGateTable<UpcomingFeature>
                            features={visibleUpcoming}
                            cluster={cluster}
                            secondColumn={{
                                header: 'Activated elsewhere',
                                render: feature => <OtherActivationsCell activations={feature.otherActivations} />,
                            }}
                            footer={upcomingFooter}
                        />
                    </CollapsibleSection>
                )}

                {sortedActivated.length > 0 && (
                    <CollapsibleSection
                        title={<SectionTitle count={sortedActivated.length}>Activated</SectionTitle>}
                        titleClassName={SECTION_TITLE_CLASS_NAME}
                        className=""
                    >
                        <FeatureGateTable<ActivatedFeature>
                            features={sortedActivated}
                            cluster={cluster}
                            secondColumn={{
                                header: 'Activation',
                                render: feature => (
                                    <ActivationCell
                                        cluster={cluster}
                                        epoch={feature.clusterActivationEpoch}
                                        countdownInput={countdownInput}
                                    />
                                ),
                                sort: { direction: sortDirection, onToggle: toggleSortDirection },
                            }}
                        />
                    </CollapsibleSection>
                )}
            </PageSections>
        </PageLayout>
    );
}

// The record count rides in the title as a muted, smaller run, the way `BlockHistoryCard` counts its
// transactions; `inline-block` keeps it whole when it wraps under the title.
function SectionTitle({ children, count }: { children: ReactNode; count: number }) {
    return (
        <>
            <span className="mr-2">{children}</span>
            <span className="inline-block text-sm font-normal text-outer-space-300">{count} records</span>
        </>
    );
}

// The sort lives in the URL like `BlockHistoryCard`'s, so a sorted list survives a reload and can be shared.
// The default direction is written as a clean URL; other params (`cluster`) survive the change.
function useSortDirection(): [SortDirection, () => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const param = searchParams?.get(SORT_PARAM);
    const direction = isSortDirection(param) ? param : DEFAULT_SORT_DIRECTION;

    const toggle = useCallback(() => {
        const params = new URLSearchParams(searchParams?.toString());
        const next: SortDirection = direction === 'asc' ? 'desc' : 'asc';
        if (next === DEFAULT_SORT_DIRECTION) params.delete(SORT_PARAM);
        else params.set(SORT_PARAM, next);
        const queryString = params.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [direction, pathname, router, searchParams]);

    return [direction, toggle];
}

function ActivationCell({
    cluster,
    epoch,
    countdownInput,
}: {
    cluster: Exclude<Cluster, Cluster.Custom>;
    epoch: number;
    countdownInput: CountdownInput | undefined;
}) {
    const countdown = countdownInput ? estimateTimeUntilEpoch({ ...countdownInput, targetEpoch: epoch }) : undefined;
    return (
        // One line on the mobile card, the countdown under the epoch in the desktop column. Both runs take the
        // cell's type size.
        <div className="flex flex-wrap items-baseline gap-x-2 text-outer-space-300 lg:flex-col lg:items-start lg:gap-0.5">
            <ClusterEpoch cluster={cluster} epoch={epoch} />
            {countdown && <span className="whitespace-nowrap">in ~{countdown}</span>}
        </div>
    );
}
