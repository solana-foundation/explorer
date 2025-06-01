'use client';

import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import React from 'react';

import FEATURES from '@/app/utils/feature-gate/featureGates.json';

import { Address } from '../components/common/Address';
import { useCluster } from '../providers/cluster';
import { Cluster, clusterSlug } from '../utils/cluster';
import { FeatureInfoType } from '../utils/feature-gate/types';

export default function FeatureGatesPageClient() {
    const { cluster } = useCluster();

    const clusterActivationEpoch = (feature: FeatureInfoType) => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                return parseInt(String(feature.mainnet_activation_epoch ?? '0'));
            case Cluster.Devnet:
                return parseInt(String(feature.devnet_activation_epoch ?? '0'));
            case Cluster.Testnet:
                return parseInt(String(feature.testnet_activation_epoch ?? '0'));
            default:
                return 0;
        }
    };

    const filteredFeatures = (FEATURES as FeatureInfoType[])
        .map(feature => ({
            ...feature,
            clusterActivationEpoch: clusterActivationEpoch(feature),
        }))
        .filter((feature: FeatureInfoType & { clusterActivationEpoch: number }) => {
            return feature.clusterActivationEpoch > 0;
        })
        .sort((a, b) => {
            return (b.clusterActivationEpoch ?? 0) - (a.clusterActivationEpoch ?? 0);
        });

    return (
        <div className="mx-4 mt-4">
            <h1>Feature Gates</h1>
            {cluster === Cluster.Custom ? (
                <div className="alert alert-warning" role="alert">
                    This is a custom cluster. Enumeration of feature gates is not available.
                </div>
            ) : (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="px-3">Feature</th>
                                    <th className="px-3">Activation</th>
                                    <th className="px-3">SIMDs</th>
                                    <th className="px-3">Description</th>
                                    <th className="px-3">Key</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFeatures.map(feature => (
                                    <tr key={feature.key}>
                                        <td className="px-3">{feature.title}</td>
                                        <td className="px-3">
                                            <Link
                                                href={`/epoch/${feature.clusterActivationEpoch}?cluster=${clusterSlug(
                                                    cluster
                                                )}`}
                                                className="epoch-link mb-1"
                                            >
                                                {feature.clusterActivationEpoch}
                                            </Link>
                                        </td>
                                        <td className="px-3">
                                            {feature.simds[0] && feature.simd_link[0] && (
                                                <a
                                                    href={feature.simd_link[0]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline-primary fs-sm"
                                                >
                                                    {feature.simds.map(simd => simd.replace(/^0+/, ''))}
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-3">{feature.description}</td>
                                        <td className="px-3">
                                            <Address pubkey={new PublicKey(feature.key)} link />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
