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

import { ClusterInfo, useCluster } from '@/app/providers/cluster';
import { Cluster, clusterName } from '@/app/utils/cluster';
import { getEpochForSlot } from '@/app/utils/epoch-schedule';
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
    const { cluster, clusterInfo } = useCluster();

    let activatedAtSlot;
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
        simdLink = (
            <tr>
                <td>SIMDs</td>
                <td className="text-lg-end">
                    {featureInfo.simds.map((simd, index) => (
                        <div key={index}>
                            {simd && featureInfo.simd_link[index] ? (
                                <a
                                    href={featureInfo.simd_link[index]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    SIMD {simd} <ExternalLinkIcon className="align-text-top" size={13} />
                                </a>
                            ) : (
                                <code>No link</code>
                            )}
                        </div>
                    ))}
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
                        {activatedAt !== null ? (
                            <span className="badge bg-success">Active on {clusterName(cluster)}</span>
                        ) : (
                            <code>Not yet activated on {clusterName(cluster)}</code>
                        )}
                    </td>
                </tr>

                {activatedAtSlot}

                <tr>
                    <td className="text-nowrap">Cluster Activation</td>
                    <td className="text-lg-end">
                        <ClusterActivationEpochAtCluster
                            cluster={cluster}
                            clusterInfo={clusterInfo}
                            activatedAt={activatedAt}
                        />
                    </td>
                </tr>

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

function ClusterActivationEpochAtCluster({
    cluster,
    clusterInfo,
    activatedAt,
}: {
    cluster: Cluster;
    clusterInfo: ClusterInfo | undefined;
    activatedAt: number | null;
}) {
    if (cluster === Cluster.Custom) return null;

    if (activatedAt !== null && clusterInfo?.epochSchedule) {
        const epoch = getEpochForSlot(clusterInfo?.epochSchedule, BigInt(activatedAt));
        return (
            <Link href={`/epoch/${epoch}?cluster=${cluster}`} className="epoch-link">
                {clusterName(cluster)} Epoch {epoch.toString()}
            </Link>
        );
    }
    return <code>No Activation Epoch</code>;
}
