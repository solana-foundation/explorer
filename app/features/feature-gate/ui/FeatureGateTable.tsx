'use client';

import { address } from '@solana/kit';
import Link from 'next/link';
import React, { Fragment, type ReactNode, useState } from 'react';

import { AddressLink } from '@/app/components/shared/address';
import { Card, CardContent } from '@/app/components/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/shared/ui/table';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

import type { ActivatedFeature, UpcomingFeature } from '../lib/partition-features';
import { ExpandInfoButton } from './ExpandInfoButton';
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
}: {
    features: T[];
    cluster: Cluster;
    secondColumn: SecondColumn<T>;
    /** Rendered in place of the table when `features` is empty. Pass `undefined` to render nothing. */
    emptyState: ReactNode;
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
        <Card variant="tight" className="e-overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="md:e-whitespace-nowrap">{secondColumn.header}</TableHead>
                        <TableHead className="e-hidden md:e-table-cell">SIMDs</TableHead>
                        <TableHead className="e-hidden md:e-table-cell">Key</TableHead>
                        <TableHead className="e-w-10" aria-label="Toggle details" />
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

export function emptyStateCard(message: ReactNode) {
    return (
        <Card variant="tight" className="e-overflow-hidden">
            <CardContent className="e-py-8 e-text-center e-text-dk-gray-700">{message}</CardContent>
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
    return (
        <Fragment>
            <TableRow className={isExpanded ? 'e-border-b-0' : undefined}>
                <TableCell className="e-font-medium [overflow-wrap:anywhere]">
                    <Link
                        href={`/address/${feature.key}/feature-gate?cluster=${clusterSlug(cluster)}`}
                        className="e-text-dk-white hover:e-text-dk-primary-on-dark hover:e-underline"
                    >
                        {feature.title}
                    </Link>
                </TableCell>
                <TableCell>{secondColumn.render(feature)}</TableCell>
                <TableCell className="e-hidden md:e-table-cell">
                    <SimdLinks entries={feature.simdEntries} />
                </TableCell>
                <TableCell className="e-hidden md:e-table-cell">
                    <AddressLink address={address(feature.key)} />
                </TableCell>
                <TableCell className="e-text-right">
                    <ExpandInfoButton isExpanded={isExpanded} onToggle={onToggle} controlsId={detailId} />
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow>
                    <TableCell colSpan={COLUMN_COUNT} className="e-bg-dk-gray-900-dark/40">
                        <div
                            id={detailId}
                            className="e-flex e-max-w-[48rem] e-flex-col e-gap-3 e-whitespace-normal e-text-dk-white [overflow-wrap:anywhere]"
                        >
                            <div className="e-flex e-flex-col e-gap-2 md:e-hidden">
                                <SimdLinks entries={feature.simdEntries} />
                                <AddressLink address={address(feature.key)} truncate={{ head: 6, tail: 6 }} />
                            </div>
                            {feature.description || (
                                <span className="e-text-dk-gray-700">No description available.</span>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
}
