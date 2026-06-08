import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AddSpotMarket, spotMarketFromIndex } from './types';

export function AddSpotMarketDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: AddSpotMarket;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: AddSpotMarket"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            {spotMarketFromIndex(ix, info.marketIndex) !== 'UNKNOWN' && (
                <BaseTable.Row>
                    <BaseTable.Cell>Market</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        {spotMarketFromIndex(ix, info.marketIndex)}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Market index</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.marketIndex}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Maint leverage</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.maintLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Init leverage</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.initLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Liquidation fee</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.liquidationFee}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Optimal util</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.optimalUtil}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Optimal rate</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.optimalRate}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Max rate</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.maxRate}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
