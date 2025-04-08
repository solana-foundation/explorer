import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { Address } from '@/app/components/common/Address';
import { useCluster } from '@/app/providers/cluster';

import { Cluster, clusterName } from '../cluster';
import FEATURES from './featureGates.json';
import { FeatureInfoType } from './types';

export function UpcomingFeatures() {
    const { cluster } = useCluster();

    // Don't show anything for localnet
    if (cluster === Cluster.Custom) {
        return null;
    }

    const filteredFeatures = (FEATURES as FeatureInfoType[])
        .filter((feature: FeatureInfoType) => {
            switch (cluster) {
                case Cluster.MainnetBeta:
                    // Show features activated on devnet and testnet
                    return feature.devnetActivationEpoch !== null && feature.testnetActivationEpoch !== null;
                case Cluster.Devnet:
                    // Show features activated on testnet, mark if already activated on devnet
                    return feature.testnetActivationEpoch !== null;
                case Cluster.Testnet:
                    // Only show features not yet activated on testnet
                    return feature.testnetActivationEpoch === null;
                default:
                    return false;
            }
        })
        .sort((a, b) => {
            // Helper function to check if a feature is activated on current cluster
            const isActivated = (feature: FeatureInfoType) => {
                switch (cluster) {
                    case Cluster.MainnetBeta:
                        return feature.mainnetActivationEpoch !== null;
                    case Cluster.Devnet:
                        return feature.devnetActivationEpoch !== null;
                    case Cluster.Testnet:
                        return feature.testnetActivationEpoch !== null;
                    default:
                        return false;
                }
            };

            // Sort activated features to end while preserving existing ordering
            const aActivated = isActivated(a);
            const bActivated = isActivated(b);
            if (aActivated === bActivated) return 0;
            return aActivated ? 1 : -1;
        });

    if (filteredFeatures.length === 0) {
        return null;
    }

    return (
        <div className="card">
            <div className="card-header">
                <h4 className="card-header-title">
                    <span className="me-2">🚀</span>
                    Upcoming {clusterName(cluster)} Features
                </h4>
            </div>
            <div className="table-responsive small-headers">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Activation Epochs</th>
                            <th>Feature Gate</th>
                            <th>SIMD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFeatures.map(feature => (
                            <tr key={feature.key}>
                                <td>
                                    <div className="mb-2 d-flex align-items-center">
                                        <p className="mb-0 me-3 text-decoration-underline fs-sm">{feature.title}</p>
                                        {cluster === Cluster.MainnetBeta && feature.mainnetActivationEpoch && (
                                            <span className="badge bg-success">Active on Mainnet</span>
                                        )}
                                        {cluster === Cluster.Devnet && feature.devnetActivationEpoch && (
                                            <span className="badge bg-success">Active on Devnet</span>
                                        )}
                                        {cluster === Cluster.Testnet && feature.testnetActivationEpoch && (
                                            <span className="badge bg-success">Active on Testnet</span>
                                        )}
                                    </div>
                                    <p className="mb-0 fs-sm">{feature.description}</p>
                                </td>
                                <td>
                                    <div className="d-flex flex-column fs-sm">
                                        {feature.mainnetActivationEpoch && (
                                            <Link
                                                href={`/epoch/${feature.mainnetActivationEpoch}?cluster=mainnet`}
                                                className="epoch-link mb-1"
                                            >
                                                Mainnet: {feature.mainnetActivationEpoch}
                                            </Link>
                                        )}
                                        {feature.devnetActivationEpoch && (
                                            <Link
                                                href={`/epoch/${feature.devnetActivationEpoch}?cluster=devnet`}
                                                className="epoch-link mb-1"
                                            >
                                                Devnet: {feature.devnetActivationEpoch}
                                            </Link>
                                        )}
                                        {feature.testnetActivationEpoch && (
                                            <Link
                                                href={`/epoch/${feature.testnetActivationEpoch}?cluster=testnet`}
                                                className="epoch-link"
                                            >
                                                Testnet: {feature.testnetActivationEpoch}
                                            </Link>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <Address
                                        pubkey={new PublicKey(feature.key)}
                                        link
                                        truncateChars={feature.simd ? 12 : 20}
                                    />
                                </td>
                                <td>
                                    {feature.simd && feature.simd_link && (
                                        <a
                                            href={feature.simd_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-primary fs-sm"
                                        >
                                            SIMD {feature.simd}
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
