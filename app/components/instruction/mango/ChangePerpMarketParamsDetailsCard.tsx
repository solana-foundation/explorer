import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { formatDuration } from '@utils/date';
import { useEffect, useState } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { ChangePerpMarketParams, getPerpMarketFromInstruction, getPerpMarketFromPerpMarketConfig } from '@explorer/decoder-mango';

export function ChangePerpMarketParamsDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: ChangePerpMarketParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    const perpMarketAccountMeta = ix.keys[1];
    const mangoPerpMarketConfig = getPerpMarketFromInstruction(ix, perpMarketAccountMeta);

    const cluster = useCluster();
    const [targetPeriodLength, setTargetPeriodLength] = useState<number | null>(null);
    useEffect(() => {
        async function getTargetPeriodLength() {
            if (mangoPerpMarketConfig === undefined) {
                return;
            }
            const mangoPerpMarket = await getPerpMarketFromPerpMarketConfig(cluster.url, mangoPerpMarketConfig);

            setTargetPeriodLength(mangoPerpMarket.liquidityMiningInfo.targetPeriodLength.toNumber());
        }

        getTargetPeriodLength();
    }, [cluster.url, mangoPerpMarketConfig]);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: ChangePerpMarketParams"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            {info.initLeverageOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Init leverage</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.initLeverage}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.liquidationFeeOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Liquidation fee</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.liquidationFee}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.maintLeverageOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Maint leverage</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.maintLeverage}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.makerFeeOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Maker fee</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.makerFee}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.mngoPerPeriodOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>
                        MNGO per {targetPeriodLength !== null && formatDuration(targetPeriodLength, 'seconds')}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {info.mngoPerPeriod} {}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}

            {info.maxDepthBpsOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Max depth bps</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.maxDepthBps}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.rateOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Rate</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.rate}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.takerFeeOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Taker fee</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.takerFee}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.targetPeriodLengthOption && (
                <BaseTable.Row>
                    <BaseTable.Cell>Target period length</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.targetPeriodLength}</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </InstructionCard>
    );
}
