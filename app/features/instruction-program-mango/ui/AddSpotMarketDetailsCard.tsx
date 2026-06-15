import { InstructionCard } from '@components/instruction/InstructionCard';
import { AddSpotMarket, spotMarketFromIndex } from '@explorer/decoder-mango';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

export function AddSpotMarketDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: AddSpotMarket;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    const spotMarket = spotMarketFromIndex(ix, info.marketIndex);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: AddSpotMarket"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            {spotMarket !== undefined && spotMarket !== 'UNKNOWN' && (
                <BaseTable.Row>
                    <BaseTable.Cell>Market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{spotMarket}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Market index</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.marketIndex}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Maint leverage</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.maintLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Init leverage</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.initLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Liquidation fee</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.liquidationFee}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Optimal util</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.optimalUtil}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Optimal rate</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.optimalRate}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Max rate</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.maxRate}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
