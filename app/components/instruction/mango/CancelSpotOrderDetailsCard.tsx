import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { CancelSpotOrder, getSpotMarketFromInstruction } from '@explorer/decoder-mango';

export function CancelSpotOrderDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: CancelSpotOrder;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[2];
    const spotMarketAccountMeta = ix.keys[4];
    const mangoSpotMarketConfig = getSpotMarketFromInstruction(ix, spotMarketAccountMeta);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: CancelSpotOrder"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Mango account</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={mangoAccount.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            {mangoSpotMarketConfig !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Spot market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{mangoSpotMarketConfig.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Spot market address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={spotMarketAccountMeta.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.orderId}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
