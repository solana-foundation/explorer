'use client';

import Link from 'next/link';
import React, { Fragment, type ReactNode, useState } from 'react';

import { AddressLink } from '@/app/components/shared/address';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/shared/ui/table';
import { cn } from '@/app/components/shared/utils';
import { Card, CardContent } from '@/app/shared/ui/Card';
import { ExpandInfoButton } from '@/app/shared/ui/ExpandInfoButton';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import type { ActivatedFeature, UpcomingFeature } from '../lib/partition-features';
import { SimdLinks } from './SimdLinks';

export type FeatureRow = ActivatedFeature | UpcomingFeature;

type SecondColumn<T extends FeatureRow> = {
    header: ReactNode;
    /** Cell content for the column whose meaning differs between Activated / Upcoming. */
    render: (feature: T) => ReactNode;
};

const COLUMN_COUNT = 5;

export function FeatureGateTable<T extends FeatureRow>({
    features,
    cluster,
    secondColumn,
    emptyState,
    header,
}: {
    features: T[];
    cluster: Cluster;
    secondColumn: SecondColumn<T>;
    /** Rendered in place of the table when `features` is empty. Pass `undefined` to render nothing. */
    emptyState: ReactNode;
    /** Optional content rendered above the table, inside the card. */
    header?: ReactNode;
}) {
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

    const toggle = (key: string) =>
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    if (features.length === 0) return emptyState;

    return (
        <Card variant="tight" className="overflow-hidden">
            {header}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="lg:whitespace-nowrap">{secondColumn.header}</TableHead>
                        <TableHead className="hidden lg:table-cell">SIMDs</TableHead>
                        <TableHead className="hidden lg:table-cell">Key</TableHead>
                        <TableHead className="w-10" aria-label="Toggle details" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {features.map(feature => (
                        <FeatureRowView
                            key={feature.key}
                            feature={feature}
                            cluster={cluster}
                            secondColumn={secondColumn}
                            isExpanded={expanded.has(feature.key)}
                            onToggle={() => toggle(feature.key)}
                        />
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

export function EmptyStateCard({ children }: { children: ReactNode }) {
    return (
        <Card variant="tight" className="overflow-hidden">
            <CardContent className="mt-6 flex items-center justify-center px-6 text-center text-dark-muted-foreground">
                {children}
            </CardContent>
        </Card>
    );
}

function FeatureRowView<T extends FeatureRow>({
    feature,
    cluster,
    secondColumn,
    isExpanded,
    onToggle,
}: {
    feature: T;
    cluster: Cluster;
    secondColumn: SecondColumn<T>;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const detailId = `feature-detail-${feature.key}`;
    // Whole-row click is a mouse convenience; the ExpandInfoButton stays the
    // keyboard/screen-reader control. Skip clicks that land on a real control
    // (the title link, address/SIMD links, or the toggle button itself) so they
    // keep their own behaviour and the button never toggles twice.
    const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        onToggle();
    };
    return (
        <Fragment>
            <TableRow
                onClick={handleRowClick}
                className={cn('cursor-pointer hover:bg-dk-gray-900-dark/40', isExpanded && 'border-b-0')}
            >
                <TableCell className="font-medium [overflow-wrap:anywhere]">
                    <Link
                        href={`/address/${feature.key}/feature-gate?cluster=${clusterSlug(cluster)}`}
                        className="text-dk-white hover:text-dark-accent hover:underline"
                    >
                        {feature.title}
                    </Link>
                </TableCell>
                <TableCell>{secondColumn.render(feature)}</TableCell>
                <TableCell className="hidden lg:table-cell">
                    <SimdLinks entries={feature.simdEntries} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                    <AddressLink address={feature.key} />
                </TableCell>
                <TableCell className="text-right">
                    <ExpandInfoButton isExpanded={isExpanded} onToggle={onToggle} controlsId={detailId} />
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow>
                    <TableCell colSpan={COLUMN_COUNT} className="bg-dk-gray-900-dark/40">
                        <div
                            id={detailId}
                            className="flex max-w-[48rem] flex-col gap-3 whitespace-normal text-dk-white [overflow-wrap:anywhere]"
                        >
                            <div className="flex flex-col gap-2 lg:hidden">
                                <SimdLinks entries={feature.simdEntries} />
                                <AddressLink address={feature.key} truncate={{ head: 6, tail: 6 }} />
                            </div>
                            {feature.description || (
                                <span className="text-dark-muted-foreground">No description available.</span>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
}
