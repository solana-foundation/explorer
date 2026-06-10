import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { type FeatureInfoType, getFeatureInfo } from '@entities/feature-gate';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { parseFeatureAccount, useFeatureAccount } from '@utils/parseFeatureAccount';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { ClusterInfo, useCluster } from '@/app/providers/cluster';
import { BaseTable } from '@/app/shared/ui/Table';
import { Cluster, clusterName } from '@/app/utils/cluster';
import { getEpochForSlot } from '@/app/utils/epoch-schedule';

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
                <BaseFeatureCard
                    account={account}
                    activatedAt={null}
                    address={address}
                    featureInfo={maybeFeatureInfo}
                />
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
    const isPending = feature.activatedAt === null;

    return (
        <BaseFeatureCard
            account={account}
            address={feature.address}
            activatedAt={feature.activatedAt}
            featureInfo={featureInfo}
            isPending={isPending}
        />
    );
};

const BaseFeatureCard = ({
    account,
    activatedAt,
    address,
    featureInfo,
    isPending = false,
}: ReturnType<typeof parseFeatureAccount> & {
    account: Account;
    featureInfo?: FeatureInfoType;
    isPending?: boolean;
}) => {
    const { cluster, clusterInfo } = useCluster();

    let activatedAtSlot;
    let simdLink;
    if (activatedAt) {
        activatedAtSlot = (
            <BaseTable.Row>
                <BaseTable.Cell className="e-whitespace-nowrap">Activated At Slot</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Slot slot={activatedAt} link />
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    }
    if (featureInfo) {
        simdLink = (
            <BaseTable.Row>
                <BaseTable.Cell>SIMDs</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {featureInfo.simds.map((simd, index) => (
                        <div key={index}>
                            {simd && featureInfo.simd_link[index] ? (
                                <a
                                    href={featureInfo.simd_link[index]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    SIMD {simd} <ExternalLinkIcon className="e-align-text-top" size={13} />
                                </a>
                            ) : (
                                <code>No link</code>
                            )}
                        </div>
                    ))}
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    }

    return (
        <AccountCard title={featureInfo?.title ?? 'Feature Activation'} account={account} layout="expanded">
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={new PublicKey(address)} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell className="e-whitespace-nowrap">Activated?</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {activatedAt !== null ? (
                        <Badge ui="dashkit" variant="success" tone="solid">
                            Active on {clusterName(cluster)}
                        </Badge>
                    ) : isPending ? (
                        <Badge ui="dashkit" variant="warning" tone="solid">
                            Pending activation on {clusterName(cluster)}
                        </Badge>
                    ) : (
                        <code>Not yet activated on {clusterName(cluster)}</code>
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>

            {activatedAtSlot}

            <BaseTable.Row>
                <BaseTable.Cell className="e-whitespace-nowrap">Cluster Activation</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <ClusterActivationEpochAtCluster
                        cluster={cluster}
                        clusterInfo={clusterInfo}
                        activatedAt={activatedAt}
                        isPending={isPending}
                    />
                </BaseTable.Cell>
            </BaseTable.Row>

            {featureInfo?.description && (
                <BaseTable.Row>
                    <BaseTable.Cell>Description</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">{featureInfo?.description}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            {simdLink}
        </AccountCard>
    );
};

const AVERAGE_SLOT_TIME_MS = 400;

function formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return 'any moment now';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0 || seconds > 0) parts.push(`${seconds}s`);
    return `~${parts.join(' ')}`;
}

function EpochCountdown({ remainingSlots }: { remainingSlots: bigint }) {
    const estimatedSeconds = Math.ceil((Number(remainingSlots) * AVERAGE_SLOT_TIME_MS) / 1000);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        const target = Date.now() + estimatedSeconds * 1000;
        const tick = () => setSecondsLeft(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [estimatedSeconds]);

    if (secondsLeft === null) return null;

    const label = formatCountdown(secondsLeft);

    return (
        <span className="e-text-dk-warning-on-dark" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {secondsLeft > 0 ? `${label} remaining` : label}
        </span>
    );
}

function ClusterActivationEpochAtCluster({
    cluster,
    clusterInfo,
    activatedAt,
    isPending = false,
}: {
    cluster: Cluster;
    clusterInfo: ClusterInfo | undefined;
    activatedAt: number | null;
    isPending?: boolean;
}) {
    if (cluster === Cluster.Custom) return null;

    if (activatedAt !== null && clusterInfo?.epochSchedule) {
        const epoch = getEpochForSlot(clusterInfo.epochSchedule, BigInt(activatedAt));
        return (
            <Link href={`/epoch/${epoch}?cluster=${cluster}`} className="epoch-link">
                {clusterName(cluster)} Epoch {epoch.toString()}
            </Link>
        );
    }

    if (isPending && clusterInfo?.epochInfo) {
        const nextEpoch = clusterInfo.epochInfo.epoch + 1n;
        const remainingSlots = clusterInfo.epochInfo.slotsInEpoch - clusterInfo.epochInfo.slotIndex;
        return (
            <div>
                <Link href={`/epoch/${nextEpoch}?cluster=${cluster}`} className="epoch-link">
                    {clusterName(cluster)} Epoch {nextEpoch.toString()}
                </Link>
                <div className="e-mt-[3px]">
                    <EpochCountdown remainingSlots={remainingSlots} />
                </div>
            </div>
        );
    }

    return <code>No Activation Epoch</code>;
}
