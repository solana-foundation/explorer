import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { Epoch } from '@components/common/Epoch';
import { ExternalLinkWarning } from '@components/common/ExternalLinkWarning';
import { Slot } from '@components/common/Slot';
import { cn } from '@components/shared/utils';
import { type BlockWithV1, summarizeBlockTransactionVersions } from '@entities/block-data';
import { summarizeBlockComputeUnits } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { IBRL_EXPLORER_URL } from '@utils/env';
import { ExternalLink } from 'react-feather';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { Card } from '@/app/shared/ui/Card';
import { KeyValue, TextValue } from '@/app/shared/ui/key-value';

type BlockOverviewCardProps = {
    block: BlockWithV1;
    slot: number;
    epoch: bigint | undefined;
    blockLeader?: PublicKey;
    childSlot?: number;
    childLeader?: PublicKey;
    parentLeader?: PublicKey;
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
        max: maxComputeUnits,
    } = summarizeBlockComputeUnits({ block, cluster, epoch });

    const { entries: versionEntries } = summarizeBlockTransactionVersions(block);

    const showSuccessfulCount = block.transactions.every(tx => tx.meta !== null);
    const successfulTxs = block.transactions.filter(tx => tx.meta?.err === null);

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
                        <Address pubkey={blockLeader} link noTruncate />
                    </KeyValue>
                )}
                <KeyValue label="Timestamp">
                    {block.blockTime ? <Timestamp unixTimestamp={block.blockTime} /> : 'Unavailable'}
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
                        <Address pubkey={parentLeader} link noTruncate />
                    </KeyValue>
                )}
                {childSlot !== undefined && (
                    <KeyValue label="Child Slot">
                        <Slot slot={childSlot} link />
                    </KeyValue>
                )}
                {childLeader !== undefined && (
                    <KeyValue label="Child Slot Leader">
                        <Address pubkey={childLeader} link noTruncate />
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
                        ))}
                    </span>
                </KeyValue>
                {showSuccessfulCount && <KeyValue label="Successful Transactions">{successfulTxs.length}</KeyValue>}
                <KeyValue label="Total CUs Consumed">{totalCUs.toLocaleString()}</KeyValue>
                <KeyValue label="Transaction Cost Utilization">
                    {totalCostUnits.toLocaleString()} / {maxComputeUnits.toLocaleString()}{' '}
                    <span className="text-outer-space-300">
                        ({Math.round((totalCostUnits / maxComputeUnits) * 100)}%)
                    </span>
                </KeyValue>
                <KeyValue label="Reserved Compute Units" divider={false}>
                    {totalRequestedCUs.toLocaleString()} / {maxComputeUnits.toLocaleString()}{' '}
                    <span className="text-outer-space-300">
                        ({Math.round((totalRequestedCUs / maxComputeUnits) * 100)}%)
                    </span>
                </KeyValue>
            </Card>
        </section>
    );
}
