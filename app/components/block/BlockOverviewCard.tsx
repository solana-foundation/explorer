import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { Epoch } from '@components/common/Epoch';
import { ExternalLinkWarning } from '@components/common/ExternalLinkWarning';
import { Slot } from '@components/common/Slot';
import { cn } from '@components/shared/utils';
import { type BlockData, isBlockTransaction, summarizeBlockTransactionVersions } from '@entities/block-data';
import { summarizeBlockComputeUnits } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import { Alert } from '@shared/ui/Alert';
import type { Address as KitAddress, Slot as KitSlot } from '@solana/kit';
import { IBRL_EXPLORER_URL } from '@utils/env';
import { ExternalLink } from 'react-feather';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { Card } from '@/app/shared/ui/Card';
import { KeyValue, TextValue } from '@/app/shared/ui/key-value';

type BlockOverviewCardProps = {
    block: BlockData;
    slot: number;
    epoch: bigint | undefined;
    blockLeader?: KitAddress;
    childSlot?: KitSlot;
    childLeader?: KitAddress;
    parentLeader?: KitAddress;
    className?: string;
};

export function BlockOverviewCard({
    block,
    slot,
    epoch,
    blockLeader,
    childSlot,
    childLeader,
    parentLeader,
    className,
}: BlockOverviewCardProps) {
    const { cluster } = useCluster();

    const {
        consumed: totalCUs,
        requested: totalRequestedCUs,
        cost: totalCostUnits,
        incomplete: computeTotalsIncomplete,
        max: maxComputeUnits,
    } = summarizeBlockComputeUnits({ block, cluster, epoch });
    const maxCostUnits = BigInt(maxComputeUnits);
    const totalCostPercent = ((totalCostUnits * 100n + maxCostUnits / 2n) / maxCostUnits).toString();

    const { entries: versionEntries, incomplete: versionsIncomplete } = summarizeBlockTransactionVersions(block);

    const showSuccessfulCount = block.transactions.every(tx => isBlockTransaction(tx) && tx.meta !== null);
    const successfulTxs = block.transactions.filter(tx => isBlockTransaction(tx) && tx.meta?.err === null);

    return (
        <section className={cn('flex flex-col gap-3', className)}>
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-lg font-normal text-white">Overview</h2>
                {IBRL_EXPLORER_URL && (
                    <ExternalLinkWarning href={`${IBRL_EXPLORER_URL}/block/${slot}`}>
                        <>
                            <ExternalLink className="me-2 align-text-top" size={13} />
                            IBRL Explorer
                        </>
                    </ExternalLinkWarning>
                )}
            </div>
            {(computeTotalsIncomplete || versionsIncomplete) && (
                <Alert variant="warning" className="mb-0">
                    Some transactions could not be parsed. Version counts and compute totals include only readable
                    transactions.
                </Alert>
            )}
            <Card ui="dashkit">
                <KeyValue label="Blockhash">
                    <Copyable text={block.blockhash}>
                        <TextValue>{block.blockhash}</TextValue>
                    </Copyable>
                </KeyValue>
                <KeyValue label="Slot">
                    <Copyable text={String(slot)}>
                        <Slot slot={slot} />
                    </Copyable>
                </KeyValue>
                {blockLeader !== undefined && (
                    <KeyValue label="Slot Leader">
                        <Address address={blockLeader} link noTruncate />
                    </KeyValue>
                )}
                <KeyValue label="Timestamp">
                    {block.blockTime ? <Timestamp unixTimestamp={Number(block.blockTime)} /> : 'Unavailable'}
                </KeyValue>
                {epoch !== undefined && (
                    <KeyValue label="Epoch">
                        <Epoch epoch={epoch} link />
                    </KeyValue>
                )}
                <KeyValue label="Parent Blockhash">
                    <Copyable text={block.previousBlockhash}>
                        <TextValue>{block.previousBlockhash}</TextValue>
                    </Copyable>
                </KeyValue>
                <KeyValue label="Parent Slot">
                    <Slot slot={block.parentSlot} link />
                </KeyValue>
                {parentLeader !== undefined && (
                    <KeyValue label="Parent Slot Leader">
                        <Address address={parentLeader} link noTruncate />
                    </KeyValue>
                )}
                {childSlot !== undefined && (
                    <KeyValue label="Child Slot">
                        <Slot slot={childSlot} link />
                    </KeyValue>
                )}
                {childLeader !== undefined && (
                    <KeyValue label="Child Slot Leader">
                        <Address address={childLeader} link noTruncate />
                    </KeyValue>
                )}
                <KeyValue label="Processed Transactions">{block.transactions.length}</KeyValue>
                <KeyValue label="Transaction Versions">
                    <span>
                        {versionEntries.map(({ count, label, share, version }, index) => (
                            <span key={String(version)}>
                                {index > 0 && <span className="text-outer-space-300"> &middot; </span>}
                                {label}: {count.toLocaleString()}{' '}
                                <span className="text-outer-space-300">({Math.round(share * 100)}%)</span>
                            </span>
                        ))}{' '}
                        {versionsIncomplete && <span className="text-outer-space-300">(incomplete)</span>}
                    </span>
                </KeyValue>
                {showSuccessfulCount && <KeyValue label="Successful Transactions">{successfulTxs.length}</KeyValue>}
                <KeyValue label="Total CUs Consumed">
                    {totalCUs.toLocaleString()}
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </KeyValue>
                <KeyValue label="Transaction Cost Utilization">
                    {totalCostUnits.toLocaleString()} / {maxComputeUnits.toLocaleString()}
                    {/* ml-1 (not {' '}) because the KeyValue value column is flex, which strips a whitespace-only node between children. */}
                    <span className="ml-1 text-outer-space-300">({totalCostPercent}%)</span>
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </KeyValue>
                <KeyValue label="Reserved Compute Units" divider={false}>
                    {totalRequestedCUs.toLocaleString()} / {maxComputeUnits.toLocaleString()}
                    {/* ml-1 (not {' '}) because the KeyValue value column is flex, which strips a whitespace-only node between children. */}
                    <span className="ml-1 text-outer-space-300">
                        ({Math.round((totalRequestedCUs / maxComputeUnits) * 100)}%)
                    </span>
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </KeyValue>
            </Card>
        </section>
    );
}
