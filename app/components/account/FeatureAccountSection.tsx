import { Address } from '@components/common/Address';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { parseFeatureAccount } from '@utils/parseFeatureAccount';
import Link from 'next/link';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';
import { FeatureInfoType } from '@/app/utils/feature-gate/types';
import { getFeatureInfo } from '@/app/utils/feature-gate/utils';

import { UnknownAccountCard } from './UnknownAccountCard';

export function FeatureAccountSection({ account }: { account: Account }) {
    return (
        <ErrorBoundary fallback={<UnknownAccountCard account={account} />}>
            <FeatureCard account={account} />
        </ErrorBoundary>
    );
}

type Props = Readonly<{
    account: Account;
}>;

const FeatureCard = ({ account }: Props) => {
    const { cluster } = useCluster();
    const feature = parseFeatureAccount(account);
    const featureInfo = useMemo(() => getFeatureInfo(feature.address), [feature.address]);

    let activatedAtSlot;
    let clusterActivation;
    let simdLink;
    if (feature.activatedAt) {
        activatedAtSlot = (
            <tr>
                <td className="text-nowrap">Activated At Slot</td>
                <td className="text-lg-end">
                    <code>{feature.activatedAt}</code>
                </td>
            </tr>
        );
    }
    if (feature.activatedAt && featureInfo) {
        clusterActivation = (
            <tr>
                <td className="text-nowrap">Cluster Activation</td>
                <td className="text-lg-end">
                    <ClusterActivationEpochAtCluster featureInfo={featureInfo} cluster={cluster} />
                </td>
            </tr>
        );
        simdLink = (
            <tr>
                <td>SIMD</td>
                <td className="text-lg-end">
                    {featureInfo.simd && featureInfo.simd_link ? (
                        <a href={featureInfo.simd_link} target="_blank" rel="noopener noreferrer" className="">
                            SIMD {featureInfo.simd} <ExternalLinkIcon className="align-text-top" size={13} />
                        </a>
                    ) : (
                        <code>No link</code>
                    )}
                </td>
            </tr>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title mb-0 d-flex align-items-center">
                    {featureInfo?.title ?? 'Feature Activation'}
                </h3>
            </div>

            <TableCardBody layout="expanded">
                <tr>
                    <td>Address</td>
                    <td>
                        <Address pubkey={new PublicKey(feature.address)} alignRight raw />
                    </td>
                </tr>

                {featureInfo ? (
                    <tr>
                        <td className="text-nowrap">Activated At</td>
                        <td className="text-lg-end">
                            <FeatureActivatedAtCluster featureInfo={featureInfo} cluster={cluster} />
                        </td>
                    </tr>
                ) : (
                    <tr>
                        <td>Activated?</td>
                        <td className="text-lg-end">
                            <code>{feature.activatedAt === null ? 'No' : 'Yes'}</code>
                        </td>
                    </tr>
                )}

                {activatedAtSlot}

                {clusterActivation}

                {featureInfo?.description && (
                    <tr>
                        <td>Description</td>
                        <td className="text-lg-end">{featureInfo?.description}</td>
                    </tr>
                )}

                {simdLink}
            </TableCardBody>
        </div>
    );
};

function ClusterActivationEpochAtCluster({ featureInfo, cluster }: { featureInfo: FeatureInfoType; cluster: Cluster }) {
    if (cluster === Cluster.Custom) return null;

    return (
        <>
            {featureInfo.mainnetActivationEpoch && cluster === Cluster.MainnetBeta && (
                <div>
                    <Link href={`/epoch/${featureInfo.mainnetActivationEpoch}?cluster=mainnet`} className="epoch-link">
                        Mainnet Epoch {featureInfo.mainnetActivationEpoch}
                    </Link>
                </div>
            )}
            {featureInfo.devnetActivationEpoch && cluster === Cluster.Devnet && (
                <div>
                    <Link href={`/epoch/${featureInfo.devnetActivationEpoch}?cluster=devnet`} className="epoch-link">
                        Devnet Epoch {featureInfo.devnetActivationEpoch}
                    </Link>
                </div>
            )}
            {featureInfo.testnetActivationEpoch && cluster === Cluster.Testnet && (
                <div>
                    <Link href={`/epoch/${featureInfo.testnetActivationEpoch}?cluster=testnet`} className="epoch-link">
                        Testnet Epoch {featureInfo.testnetActivationEpoch}
                    </Link>
                </div>
            )}
        </>
    );
}

function FeatureActivatedAtCluster({ featureInfo, cluster }: { featureInfo: FeatureInfoType; cluster: Cluster }) {
    if (cluster === Cluster.Custom) return null;

    return (
        <>
            {cluster === Cluster.MainnetBeta && featureInfo.mainnetActivationEpoch && (
                <span className="badge bg-success">Active on Mainnet</span>
            )}
            {cluster === Cluster.Devnet && featureInfo.devnetActivationEpoch && (
                <span className="badge bg-success">Active on Devnet</span>
            )}
            {cluster === Cluster.Testnet && featureInfo.testnetActivationEpoch && (
                <span className="badge bg-success">Active on Testnet</span>
            )}
        </>
    );
}
