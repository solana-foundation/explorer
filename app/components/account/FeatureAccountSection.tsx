import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { parseFeatureAccount, useFeatureAccount } from '@utils/parseFeatureAccount';
import Link from 'next/link';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

import { isFeatureActivated } from '@/app/features/feature-gate';
import { useCluster } from '@/app/providers/cluster';
import { Cluster, clusterName } from '@/app/utils/cluster';
import { FeatureInfoType } from '@/app/utils/feature-gate/types';
import { getFeatureInfo } from '@/app/utils/feature-gate/utils';

import { UnknownAccountCard } from './UnknownAccountCard';

export function FeatureAccountSection({ account }: { account: Account }) {
    const address = account.pubkey.toBase58();

    // Making decision about card rendering upon these factors:
    //  - assume that account could be parsed by its signs
    //  - address matches feature that is present at featureGates.json
    const { isFeature } = useFeatureAccount(account);
    const maybeFeatureInfo = useMemo(() => getFeatureInfo(address), [address]);

    return (
        <ErrorBoundary fallback={<UnknownAccountCard account={account} />}>
            {isFeature ? (
                // use account-specific card that able to parse account' data
                <FeatureCard account={account} />
            ) : (
                // feature that is preset at JSON would not have data about slot. leave it as null
                <BaseFeatureCard activatedAt={null} address={address} featureInfo={maybeFeatureInfo} />
            )}
        </ErrorBoundary>
    );
}

type Props = Readonly<{
    account: Account;
}>;

const FeatureCard = ({ account }: Props) => {
    const feature = parseFeatureAccount(account);
    const featureInfo = useMemo(() => getFeatureInfo(feature.address), [feature.address]);

    return <BaseFeatureCard address={feature.address} activatedAt={feature.activatedAt} featureInfo={featureInfo} />;
};

const BaseFeatureCard = ({
    activatedAt,
    address,
    featureInfo,
}: ReturnType<typeof parseFeatureAccount> & { featureInfo?: FeatureInfoType }) => {
    const { cluster } = useCluster();

    let activatedAtSlot;
    let clusterActivation;
    let simdLink;
    if (activatedAt) {
        activatedAtSlot = (
            <tr>
                <td className="text-nowrap">Activated At Slot</td>
                <td className="text-lg-end">
                    <Slot slot={activatedAt} link />
                </td>
            </tr>
        );
    }
    if (featureInfo) {
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
                    {featureInfo.simds[0] && featureInfo.simd_link[0] ? (
                        <a href={featureInfo.simd_link[0]} target="_blank" rel="noopener noreferrer" className="">
                            SIMD {featureInfo.simds[0]} <ExternalLinkIcon className="align-text-top" size={13} />
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
                        <Address pubkey={new PublicKey(address)} alignRight raw />
                    </td>
                </tr>

                <tr>
                    <td className="text-nowrap">Activated?</td>
                    <td className="text-lg-end">
                        {featureInfo ? (
                            <FeatureActivatedAtCluster featureInfo={featureInfo} cluster={cluster} />
                        ) : (
                            <code>{activatedAt === null ? 'No' : 'Yes'}</code>
                        )}
                    </td>
                </tr>

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

function getClusterActivationEpoch(featureInfo: FeatureInfoType, cluster: Cluster) {
    if (cluster === Cluster.Custom) return null;
    if (cluster === Cluster.MainnetBeta) return featureInfo.mainnet_activation_epoch;
    if (cluster === Cluster.Devnet) return featureInfo.devnet_activation_epoch;
    if (cluster === Cluster.Testnet) return featureInfo.testnet_activation_epoch;
    return null;
}

function ClusterActivationEpochAtCluster({ featureInfo, cluster }: { featureInfo: FeatureInfoType; cluster: Cluster }) {
    if (cluster === Cluster.Custom) return null;

    const notActivated = <code>No Activation Epoch</code>;

    const clusterActivationEpoch = getClusterActivationEpoch(featureInfo, cluster);
    return clusterActivationEpoch ? (
        <Link href={`/epoch/${clusterActivationEpoch}?cluster=${cluster}`} className="epoch-link">
            {clusterName(cluster)} Epoch {clusterActivationEpoch}
        </Link>
    ) : (
        notActivated
    );
}

function FeatureActivatedAtCluster({ featureInfo, cluster }: { featureInfo: FeatureInfoType; cluster: Cluster }) {
    if (cluster === Cluster.Custom) return null;
    // Show empty state unless there is any info about Activation
    const notActivated = <code>Not yet activated on {clusterName(cluster)}</code>;

    const isActivated = isFeatureActivated(featureInfo, cluster);

    return (
        <>{isActivated ? <span className="badge bg-success">Active on {clusterName(cluster)}</span> : notActivated}</>
    );
}
