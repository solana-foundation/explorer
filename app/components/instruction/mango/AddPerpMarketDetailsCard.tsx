import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { formatDuration } from '@utils/date';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AddPerpMarket } from './types';

export function AddPerpMarketDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: AddPerpMarket;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: AddPerpMarket"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Market index</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.marketIndex}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Maintenance leverage</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.maintLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Initial leverage</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.initLeverage}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Liquidation fee</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.liquidationFee}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Maker fee</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.makerFee}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Taker fee</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.takerFee}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Base lot size</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.baseLotSize}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Quote lot size</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.quoteLotSize}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Rate</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.rate}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Max depth bps</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.maxDepthBps}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>MNGO per {formatDuration(info.targetPeriodLength, 'seconds')}</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {info.mngoPerPeriod} {}
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
