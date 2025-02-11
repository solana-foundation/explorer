import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { Address } from '@/app/components/common/Address';
import { useCluster } from '@/app/providers/cluster';

import { Cluster } from '../cluster';
import { FeatureInfoType } from './types';

export function FeatureInfoCard({ feature }: { feature: FeatureInfoType }){
    const { cluster } = useCluster();

    return (
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
    )
}
