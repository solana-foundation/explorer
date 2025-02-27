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
                <h3 className="card-header-title">
                    <span className="me-2">🚀</span>
                    Upcoming {clusterName(cluster)} Features
                </h3>
            </div>
            <div className="card-body">
                <div className="row">
                    {filteredFeatures.map(feature => (
                        <div key={feature.key} className="col-12 col-lg-4 mb-4">
                            <div className="card h-100 feature-card">
                                <div className="card-body d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <h4 className="card-title mb-0 text-decoration-underline">{feature.title}</h4>
                                    </div>

                                    <p className="card-text flex-grow-1">{feature.description}</p>

                                    <div className="ms-n2 mb-2">
                                        {cluster === Cluster.MainnetBeta && feature.mainnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Mainnet</span>
                                        )}
                                        {cluster === Cluster.Devnet && feature.devnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Devnet</span>
                                        )}
                                        {cluster === Cluster.Testnet && feature.testnetActivationEpoch && (
                                            <span className="badge bg-success ms-2">Active on Testnet</span>
                                        )}
                                    </div>

                                    <div className="activation-info mb-3">
                                        <div className="mb-1">Cluster Activations</div>
                                        {feature.mainnetActivationEpoch && (
                                            <div className="mb-1">
                                                <Link
                                                    href={`/epoch/${feature.mainnetActivationEpoch}?cluster=mainnet`}
                                                    className="epoch-link"
                                                >
                                                    Mainnet Epoch {feature.mainnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                        {feature.devnetActivationEpoch && (
                                            <div className="mb-1">
                                                <Link
                                                    href={`/epoch/${feature.devnetActivationEpoch}?cluster=devnet`}
                                                    className="epoch-link"
                                                >
                                                    Devnet Epoch {feature.devnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                        {feature.testnetActivationEpoch && (
                                            <div>
                                                <Link
                                                    href={`/epoch/${feature.testnetActivationEpoch}?cluster=testnet`}
                                                    className="epoch-link"
                                                >
                                                    Testnet Epoch {feature.testnetActivationEpoch}
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div>Feature Gate</div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Address
                                            pubkey={new PublicKey(feature.key)}
                                            link
                                            truncateChars={feature.simd ? 12 : 20}
                                        />
                                        {feature.simd && feature.simd_link && (
                                            <a
                                                href={feature.simd_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                See SIMD {feature.simd} →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
