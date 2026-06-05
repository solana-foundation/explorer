import { FEATURE_GATES, type FeatureInfoType } from '@entities/feature-gate';
import { PublicKey } from '@solana/web3.js';
import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';

import { Address } from '@/app/components/common/Address';
import { useCluster } from '@/app/providers/cluster';
import { CardBody, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import { isFeatureActivated } from '../lib/is-feature-activated';

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
            <div className="card">
                <CardBody ui="dashkit">
                    <div className="e-text-center">No upcoming features for {clusterName(cluster)}</div>
                </CardBody>
            </div>
        );
    }

    return (
        <FeaturesTable
            header={
                <div className="e-flex e-items-center e-justify-between">
                    <div>
                        <span className="e-mr-1.5">🚀</span>
                        Upcoming {clusterName(cluster)} Features
                    </div>

                    <Link href={featureGatesPath} className="e-mb-[3px]">
                        View all feature gates
                    </Link>
                </div>
            }
            features={filteredFeatures.filter(feature => !feature.mainnet_activation_epoch)}
            cluster={cluster}
        />
    );
}

function FeaturesTable({
    header,
    features,
    cluster,
}: {
    header: React.ReactNode;
    features: FeatureInfoType[];
    cluster: Cluster;
}) {
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <CardTitle as="h4" ui="dashkit">
                    {header}
                </CardTitle>
            </CardHeader>
            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive small-headers">
                <table className="table [&>thead>tr:first-child>th]:!e-border-t-0">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Activation Epochs</th>
                            <th>Feature Gate</th>
                            <th>SIMD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map(feature => (
                            <tr key={feature.key}>
                                <td>
                                    <div className="e-mb-1.5 e-flex e-items-center">
                                        <Link
                                            href={`/address/${feature.key}/feature-gate?cluster=${clusterSlug(cluster)}`}
                                            className="fs-sm e-mb-0 e-mr-3 e-underline"
                                        >
                                            {feature.title}
                                        </Link>
                                        {cluster === Cluster.MainnetBeta && feature.mainnet_activation_epoch && (
                                            <span className="badge bg-success">Active on Mainnet</span>
                                        )}
                                        {cluster === Cluster.Devnet && feature.devnet_activation_epoch && (
                                            <span className="badge bg-success">Active on Devnet</span>
                                        )}
                                        {cluster === Cluster.Testnet && feature.testnet_activation_epoch && (
                                            <span className="badge bg-success">Active on Testnet</span>
                                        )}
                                    </div>
                                    <p className="fs-sm e-mb-0">{feature.description}</p>
                                </td>
                                <td>
                                    <div className="fs-sm e-flex e-flex-col">
                                        {feature.mainnet_activation_epoch && (
                                            <Link
                                                href={`/epoch/${feature.mainnet_activation_epoch}?cluster=mainnet`}
                                                className="e-mb-[3px]"
                                            >
                                                Mainnet: {feature.mainnet_activation_epoch}
                                            </Link>
                                        )}
                                        {feature.devnet_activation_epoch && (
                                            <Link
                                                href={`/epoch/${feature.devnet_activation_epoch}?cluster=devnet`}
                                                className="e-mb-[3px]"
                                            >
                                                Devnet: {feature.devnet_activation_epoch}
                                            </Link>
                                        )}
                                        {feature.testnet_activation_epoch && (
                                            <Link href={`/epoch/${feature.testnet_activation_epoch}?cluster=testnet`}>
                                                Testnet: {feature.testnet_activation_epoch}
                                            </Link>
                                        )}
                                    </div>
                                </td>
                                <td className="fs-sm">
                                    <Address pubkey={new PublicKey(feature.key ?? '')} link />
                                </td>
                                <td>
                                    {feature.simds.map((simd, index) => (
                                        <a
                                            key={index}
                                            href={feature.simd_link[index]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-outline-primary fs-sm"
                                        >
                                            {/* eslint-disable-next-line no-restricted-syntax -- strip leading zeros from SIMD number */}
                                            SIMD {simd.replace(/^0+/, '')}
                                        </a>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
