'use client';

import { FEATURE_GATES, type FeatureInfoType } from '@entities/feature-gate';
import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { Fragment, type ReactNode, useState } from 'react';

import { AddressLink } from '@/app/components/shared/address';
import { Badge } from '@/app/components/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/shared/ui/table';
import { cn } from '@/app/components/shared/utils';
import { useCluster } from '@/app/providers/cluster';
import { Card } from '@/app/shared/ui/Card';

import { isFeatureActivated } from '../lib/is-feature-activated';
import { ExpandInfoButton } from './ExpandInfoButton';

export function UpcomingFeatures() {
    const { cluster } = useCluster();
    const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });

    // Don't show anything for localnet
    if (cluster === Cluster.Custom) {
        return undefined;
    }

    const filteredFeatures = FEATURE_GATES.filter((feature: FeatureInfoType) => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                // Show features activated on devnet and testnet
                return feature.devnet_activation_epoch !== null && feature.testnet_activation_epoch !== null;
            case Cluster.Devnet:
                // Show features activated on testnet, mark if already activated on devnet
                return feature.testnet_activation_epoch !== null;
            case Cluster.Testnet:
                // Only show features not yet activated on testnet
                return feature.testnet_activation_epoch === null;
            default:
                return false;
        }
    }).filter((feature: FeatureInfoType) => {
        return !isFeatureActivated(feature, cluster);
    });

    if (filteredFeatures.length === 0) {
        return (
            <Card variant="tight" className="e-overflow-hidden">
                <div className="e-px-4 e-py-6 e-text-center e-text-dk-gray-700">
                    No upcoming features for {clusterName(cluster)}
                </div>
            </Card>
        );
    }

    return (
        <FeaturesTable
            headerTitle={`Upcoming ${clusterName(cluster)} Features`}
            featureGatesPath={featureGatesPath}
            features={filteredFeatures.filter(feature => !feature.mainnet_activation_epoch)}
            cluster={cluster}
        />
    );
}

function FeaturesTable({
    headerTitle,
    featureGatesPath,
    features,
    cluster,
}: {
    headerTitle: string;
    featureGatesPath: string;
    features: FeatureInfoType[];
    cluster: Cluster;
}) {
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
    const toggle = (key: string) =>
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    return (
        <Card variant="tight" className="e-overflow-hidden">
            <div className="e-flex e-flex-col e-gap-1.5 e-border-b e-border-heavy-metal-950 e-px-4 e-py-3 md:e-flex-row md:e-items-center md:e-justify-between">
                <span className="e-font-medium e-text-dk-white">
                    <span className="e-mr-2">🚀</span>
                    {headerTitle}
                </span>
                <Link
                    href={featureGatesPath}
                    className="e-text-dk-sm e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                >
                    View all feature gates
                </Link>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead className="e-hidden e-whitespace-nowrap md:e-table-cell">
                            Activation Epochs
                        </TableHead>
                        <TableHead className="e-hidden md:e-table-cell">Feature Gate</TableHead>
                        <TableHead className="e-hidden md:e-table-cell">SIMD</TableHead>
                        <TableHead className="e-w-10 md:e-hidden" aria-label="Toggle details" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {features.map(feature => {
                        const isExpanded = expanded.has(feature.key);
                        const detailId = `upcoming-feature-${feature.key}`;
                        return (
                            <Fragment key={feature.key}>
                                <TableRow className={cn('[&>td]:e-align-top', isExpanded && 'e-border-b-0')}>
                                    <TableCell>
                                        <FeatureCell feature={feature} cluster={cluster} />
                                    </TableCell>
                                    <TableCell className="e-hidden md:e-table-cell">
                                        <EpochLinks feature={feature} />
                                    </TableCell>
                                    <TableCell className="e-hidden md:e-table-cell">
                                        <AddressLink address={feature.key} truncate={{ head: 6, tail: 6 }} />
                                    </TableCell>
                                    <TableCell className="e-hidden md:e-table-cell">
                                        <SimdBadges feature={feature} />
                                    </TableCell>
                                    <TableCell className="e-text-right md:e-hidden">
                                        <ExpandInfoButton
                                            isExpanded={isExpanded}
                                            onToggle={() => toggle(feature.key)}
                                            controlsId={detailId}
                                        />
                                    </TableCell>
                                </TableRow>
                                {isExpanded && <FeatureExpandRow feature={feature} detailId={detailId} />}
                            </Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </Card>
    );
}

function FeatureCell({ feature, cluster }: { feature: FeatureInfoType; cluster: Cluster }) {
    return (
        <>
            <div className="e-mb-1 e-flex e-flex-wrap e-items-center e-gap-2">
                <Link
                    href={`/address/${feature.key}/feature-gate?cluster=${clusterSlug(cluster)}`}
                    className="e-text-dk-white hover:e-text-dk-primary-on-dark hover:e-underline"
                >
                    {feature.title}
                </Link>
                <ActiveBadge feature={feature} cluster={cluster} />
            </div>
            {feature.description && <p className="e-m-0 e-text-dk-sm e-text-dk-gray-700">{feature.description}</p>}
        </>
    );
}

function ActiveBadge({ feature, cluster }: { feature: FeatureInfoType; cluster: Cluster }) {
    if (cluster === Cluster.MainnetBeta && feature.mainnet_activation_epoch)
        return <Badge variant="success">Active on Mainnet</Badge>;
    if (cluster === Cluster.Devnet && feature.devnet_activation_epoch)
        return <Badge variant="success">Active on Devnet</Badge>;
    if (cluster === Cluster.Testnet && feature.testnet_activation_epoch)
        return <Badge variant="success">Active on Testnet</Badge>;
    return undefined;
}

function FeatureExpandRow({ feature, detailId }: { feature: FeatureInfoType; detailId: string }) {
    return (
        <TableRow id={detailId} className="e-bg-dk-gray-900-dark/40 md:e-hidden">
            <TableCell colSpan={5} className="e-pt-2">
                <div className="e-flex e-flex-col e-gap-3">
                    <ExpandDetail label="Activation Epochs">
                        <EpochLinks feature={feature} />
                    </ExpandDetail>
                    <ExpandDetail label="Feature Gate">
                        <AddressLink address={feature.key} truncate={{ head: 6, tail: 6 }} />
                    </ExpandDetail>
                    {feature.simds.length > 0 && (
                        <ExpandDetail label="SIMD">
                            <SimdBadges feature={feature} />
                        </ExpandDetail>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

function ExpandDetail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <div className="e-mb-1 e-text-dk-xs e-uppercase e-tracking-widest e-text-dk-gray-700">{label}</div>
            {children}
        </div>
    );
}

function EpochLinks({ feature }: { feature: FeatureInfoType }) {
    return (
        <div className="e-flex e-flex-col e-gap-0.5 e-text-dk-sm">
            {feature.mainnet_activation_epoch && (
                <Link
                    href={`/epoch/${feature.mainnet_activation_epoch}?cluster=mainnet`}
                    className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                >
                    Mainnet: {feature.mainnet_activation_epoch}
                </Link>
            )}
            {feature.devnet_activation_epoch && (
                <Link
                    href={`/epoch/${feature.devnet_activation_epoch}?cluster=devnet`}
                    className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                >
                    Devnet: {feature.devnet_activation_epoch}
                </Link>
            )}
            {feature.testnet_activation_epoch && (
                <Link
                    href={`/epoch/${feature.testnet_activation_epoch}?cluster=testnet`}
                    className="e-text-dk-primary-dark hover:e-text-dk-primary-on-dark"
                >
                    Testnet: {feature.testnet_activation_epoch}
                </Link>
            )}
        </div>
    );
}

function SimdBadges({ feature }: { feature: FeatureInfoType }) {
    if (feature.simds.length === 0) return undefined;
    return (
        <div className="e-flex e-flex-wrap e-gap-1">
            {feature.simds.map((simd, index) => (
                <Badge key={index} as="link" size="xs" variant="info" asChild>
                    <a href={feature.simd_link[index]} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line no-restricted-syntax -- strip leading zeros from SIMD number */}
                        SIMD {simd.replace(/^0+/, '')}
                    </a>
                </Badge>
            ))}
        </div>
    );
}
