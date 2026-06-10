'use client';

import { Address } from '@components/common/Address';
import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { ExternalLinkWarning } from '@components/common/ExternalLinkWarning';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { estimateRequestedComputeUnits } from '@entities/compute-unit';
import { BlockProvider, FetchStatus, useBlock, useFetchBlock } from '@providers/block';
import { useCluster } from '@providers/cluster';
import { ClusterStatus } from '@utils/cluster';
import { displayTimestamp, displayTimestampUtc } from '@utils/date';
import { IBRL_EXPLORER_URL } from '@utils/env';
import { notFound, useSearchParams } from 'next/navigation';
import React, { PropsWithChildren, use } from 'react';
import { ExternalLink } from 'react-feather';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { type NavigationTab, NavigationTabs } from '@/app/shared/ui/navigation-tabs';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';
import { StickyHeader } from '@/app/shared/ui/sticky-header/StickyHeader';
import { BaseTable } from '@/app/shared/ui/Table';
import { getEpochForSlot, getMaxComputeUnitsInBlock } from '@/app/utils/epoch-schedule';
import { pickClusterParams } from '@/app/utils/url';

type SlotParams = { slot: string };
type Props = PropsWithChildren<{ params: Promise<SlotParams> }>;
type InnerProps = PropsWithChildren<{ params: SlotParams }>;

function BlockLayoutInner({ children, params: { slot } }: InnerProps) {
    const slotNumber = Number(slot);
    if (isNaN(slotNumber) || slotNumber >= Number.MAX_SAFE_INTEGER || slotNumber % 1 !== 0) {
        notFound();
    }
    const confirmedBlock = useBlock(slotNumber);
    const fetchBlock = useFetchBlock();
    const { clusterInfo, status, cluster } = useCluster();
    const refresh = () => fetchBlock(slotNumber);

    // Fetch block on load
    React.useEffect(() => {
        if (!confirmedBlock && status === ClusterStatus.Connected) refresh();
    }, [slotNumber, status]); // eslint-disable-line react-hooks/exhaustive-deps

    let content;
    if (!confirmedBlock || confirmedBlock.status === FetchStatus.Fetching) {
        content = <LoadingCard message="Loading block" />;
    } else if (confirmedBlock.data === undefined || confirmedBlock.status === FetchStatus.FetchFailed) {
        content = <ErrorCard retry={refresh} text="Failed to fetch block" />;
    } else if (confirmedBlock.data.block === undefined) {
        content = <ErrorCard retry={refresh} text={`Block ${slotNumber} was not found`} />;
    } else {
        const { block, blockLeader, childSlot, childLeader, parentLeader } = confirmedBlock.data;
        const epoch = clusterInfo ? getEpochForSlot(clusterInfo.epochSchedule, BigInt(slotNumber)) : undefined;

        let totalCUs = 0;
        let totalRequestedCUs = 0;
        let totalCostUnits = 0;
        for (const tx of block.transactions) {
            const requestedCUs = estimateRequestedComputeUnits(tx, epoch, cluster);
            const cus = tx.meta?.computeUnitsConsumed ?? 0;
            const costUnits = tx.meta?.costUnits ?? 0;
            totalRequestedCUs += requestedCUs;
            totalCUs += cus;
            totalCostUnits += costUnits;
        }

        const showSuccessfulCount = block.transactions.every(tx => tx.meta !== null);
        const successfulTxs = block.transactions.filter(tx => tx.meta?.err === null);
        const maxComputeUnits = getMaxComputeUnitsInBlock({ cluster, epoch });

        content = (
            <>
                <Card ui="dashkit">
                    <CardHeader ui="dashkit">
                        <CardTitle as="h3" ui="dashkit">
                            Overview
                        </CardTitle>
                        {IBRL_EXPLORER_URL && (
                            <ExternalLinkWarning href={`${IBRL_EXPLORER_URL}/block/${slotNumber}`}>
                                <>
                                    <ExternalLink className="e-me-2 e-align-text-top" size={13} />
                                    IBRL Explorer
                                </>
                            </ExternalLinkWarning>
                        )}
                    </CardHeader>
                    <TableCardBody>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Blockhash</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>{block.blockhash}</span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Slot</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <Slot slot={slotNumber} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        {blockLeader !== undefined && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Slot Leader</BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">
                                    <Address pubkey={blockLeader} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        {block.blockTime ? (
                            <>
                                <BaseTable.Row>
                                    <BaseTable.Cell>Timestamp (Local)</BaseTable.Cell>
                                    <BaseTable.Cell className="e-text-right">
                                        <span className="e-font-mono">
                                            {displayTimestamp(block.blockTime * 1000, true)}
                                        </span>
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                                <BaseTable.Row>
                                    <BaseTable.Cell>Timestamp (UTC)</BaseTable.Cell>
                                    <BaseTable.Cell className="e-text-right">
                                        <span className="e-font-mono">
                                            {displayTimestampUtc(block.blockTime * 1000, true)}
                                        </span>
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                            </>
                        ) : (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Timestamp</BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">Unavailable</BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        {epoch !== undefined && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Epoch</BaseTable.Cell>
                                <BaseTable.Cell className="e-font-mono e-text-right">
                                    <Epoch epoch={epoch} link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Parent Blockhash</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>{block.previousBlockhash}</span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Parent Slot</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <Slot slot={block.parentSlot} link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        {parentLeader !== undefined && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Parent Slot Leader</BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">
                                    <Address pubkey={parentLeader} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        {childSlot !== undefined && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Child Slot</BaseTable.Cell>
                                <BaseTable.Cell className="e-font-mono e-text-right">
                                    <Slot slot={childSlot} link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        {childLeader !== undefined && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Child Slot Leader</BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">
                                    <Address pubkey={childLeader} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Processed Transactions</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>{block.transactions.length}</span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        {showSuccessfulCount && (
                            <BaseTable.Row>
                                <BaseTable.Cell className="e-w-full">Successful Transactions</BaseTable.Cell>
                                <BaseTable.Cell className="e-font-mono e-text-right">
                                    <span>{successfulTxs.length}</span>
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Total Compute Units Consumed</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>{totalCUs.toLocaleString()}</span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Transaction Cost Utilization</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>
                                    {totalCostUnits.toLocaleString()} / {maxComputeUnits.toLocaleString()} (
                                    {Math.round((totalCostUnits / maxComputeUnits) * 100)}%)
                                </span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-w-full">Reserved Compute Units</BaseTable.Cell>
                            <BaseTable.Cell className="e-font-mono e-text-right">
                                <span>
                                    {totalRequestedCUs.toLocaleString()} / {maxComputeUnits.toLocaleString()} (
                                    {Math.round((totalRequestedCUs / maxComputeUnits) * 100)}%)
                                </span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </TableCardBody>
                </Card>
                <MoreSection slot={slotNumber}>{children}</MoreSection>
            </>
        );
    }
    return (
        <PageContainer variant="pulled-up">
            <div className="e-mb-8">
                <div className="e-border-0 e-border-b e-border-solid e-border-dk-gray-700-dark e-py-6">
                    <h6 className="e-uppercase e-tracking-[0.08em] e-text-dk-gray-700">Details</h6>
                    <h2 className="e-mb-0">Block</h2>
                </div>
            </div>
            {content}
        </PageContainer>
    );
}

export default function BlockLayout(props: Props) {
    const params = use(props.params);

    const { children } = props;

    return (
        <BlockProvider>
            <BlockLayoutInner params={params}>{children}</BlockLayoutInner>
        </BlockProvider>
    );
}

const TABS: NavigationTab[] = [
    { path: '', title: 'Transactions' },
    { path: 'rewards', title: 'Rewards' },
    { path: 'programs', title: 'Programs' },
    { path: 'accounts', title: 'Accounts' },
];

function MoreSection({ children, slot }: { children: React.ReactNode; slot: number }) {
    const searchParams = useSearchParams();
    const buildHref = React.useCallback(
        (path: string) => pickClusterParams(`/block/${slot}/${path}`, searchParams ?? undefined),
        [slot, searchParams],
    );

    return (
        <>
            <StickyHeader>
                <PageContainer>
                    <NavigationTabs buildHref={buildHref} tabs={TABS} />
                </PageContainer>
            </StickyHeader>
            {children}
        </>
    );
}
