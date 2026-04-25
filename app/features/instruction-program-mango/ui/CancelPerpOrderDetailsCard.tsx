import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';

import { BaseTable } from '@/app/shared/ui/Table';
import { CancelPerpOrder, getPerpMarketFromInstruction } from '@explorer/decoder-mango';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

export function CancelPerpOrderDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: CancelPerpOrder;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoPerpMarketConfig = getPerpMarketFromInstruction(ix, info.perpMarket);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: CancelPerpOrder"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Mango account</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={info.mangoAccount.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            {mangoPerpMarketConfig !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Perp market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{mangoPerpMarketConfig.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Perp market address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={info.perpMarket.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.orderId}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
