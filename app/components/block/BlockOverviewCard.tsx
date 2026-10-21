import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { Epoch } from '@components/common/Epoch';
import { ExternalLinkWarning } from '@components/common/ExternalLinkWarning';
import { Slot } from '@components/common/Slot';
import { type BlockData, isBlockTransaction, summarizeBlockTransactionVersions } from '@entities/block-data';
import { summarizeBlockComputeUnits } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import { Alert } from '@shared/ui/Alert';
import type { Address as KitAddress, Slot as KitSlot } from '@solana/kit';
import { IBRL_EXPLORER_URL } from '@utils/env';
import { ExternalLink } from 'react-feather';

import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { type KeyValueRowInput, KeyValueRows, TextValue } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

type BlockOverviewCardProps = {
    block: BlockData;
    slot: number;
    epoch: bigint | undefined;
    blockLeader?: KitAddress;
    childSlot?: KitSlot;
    childLeader?: KitAddress;
    parentLeader?: KitAddress;
};

export function BlockOverviewCard({
    block,
    slot,
    epoch,
    blockLeader,
    childSlot,
    childLeader,
    parentLeader,
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

    const rows: KeyValueRowInput[] = [
        {
            label: 'Blockhash',
            value: (
                <Copyable text={block.blockhash}>
                    <TextValue>{block.blockhash}</TextValue>
                </Copyable>
            ),
        },
        {
            label: 'Slot',
            value: (
                <Copyable text={String(slot)}>
                    <Slot slot={slot} />
                </Copyable>
            ),
        },
        blockLeader !== undefined && {
            label: 'Slot Leader',
            value: <Address address={blockLeader} link noTruncate />,
        },
        {
            label: 'Timestamp',
            value: block.blockTime ? <Timestamp unixTimestamp={Number(block.blockTime)} /> : 'Unavailable',
        },
        epoch !== undefined && { label: 'Epoch', value: <Epoch epoch={epoch} link /> },
        {
            label: 'Parent Blockhash',
            value: (
                <Copyable text={block.previousBlockhash}>
                    <TextValue>{block.previousBlockhash}</TextValue>
                </Copyable>
            ),
        },
        { label: 'Parent Slot', value: <Slot slot={block.parentSlot} link /> },
        parentLeader !== undefined && {
            label: 'Parent Slot Leader',
            value: <Address address={parentLeader} link noTruncate />,
        },
        childSlot !== undefined && {
            label: 'Child Slot',
            value: <Slot slot={childSlot} link />,
        },
        childLeader !== undefined && {
            label: 'Child Slot Leader',
            value: <Address address={childLeader} link noTruncate />,
        },
        { label: 'Processed Transactions', value: block.transactions.length },
        {
            label: 'Transaction Versions',
            value: (
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
            ),
        },
        showSuccessfulCount && { label: 'Successful Transactions', value: successfulTxs.length },
        {
            label: 'Total CUs Consumed',
            value: (
                <>
                    {totalCUs.toLocaleString()}
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </>
            ),
        },
        {
            label: 'Transaction Cost Utilization',
            value: (
                <>
                    {totalCostUnits.toLocaleString()} / {maxComputeUnits.toLocaleString()}
                    <span className="ml-1 text-outer-space-300">({totalCostPercent}%)</span>
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </>
            ),
        },
        {
            label: 'Reserved Compute Units',
            value: (
                <>
                    {totalRequestedCUs.toLocaleString()} / {maxComputeUnits.toLocaleString()}
                    <span className="ml-1 text-outer-space-300">
                        ({Math.round((totalRequestedCUs / maxComputeUnits) * 100)}%)
                    </span>
                    {computeTotalsIncomplete && <span className="ml-1 text-outer-space-300">(incomplete)</span>}
                </>
            ),
        },
    ];

    return (
        <OverviewCard
            title="Overview"
            actions={
                IBRL_EXPLORER_URL && (
                    <ExternalLinkWarning href={`${IBRL_EXPLORER_URL}/block/${slot}`}>
                        <>
                            <ExternalLink className="me-2 align-text-top" size={13} />
                            IBRL Explorer
                        </>
                    </ExternalLinkWarning>
                )
            }
            note={
                (computeTotalsIncomplete || versionsIncomplete) && (
                    <Alert variant="warning" className="mb-0">
                        Some transactions could not be parsed. Version counts and compute totals include only readable
                        transactions.
                    </Alert>
                )
            }
        >
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
