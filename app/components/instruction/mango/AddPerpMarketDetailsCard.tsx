import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { formatDuration } from '@utils/date';

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
            <tr>
                <td>Market index</td>
                <td className="e-text-right">{info.marketIndex}</td>
            </tr>
            <tr>
                <td>Maintenance leverage</td>
                <td className="e-text-right">{info.maintLeverage}</td>
            </tr>
            <tr>
                <td>Initial leverage</td>
                <td className="e-text-right">{info.initLeverage}</td>
            </tr>
            <tr>
                <td>Liquidation fee</td>
                <td className="e-text-right">{info.liquidationFee}</td>
            </tr>
            <tr>
                <td>Maker fee</td>
                <td className="e-text-right">{info.makerFee}</td>
            </tr>
            <tr>
                <td>Taker fee</td>
                <td className="e-text-right">{info.takerFee}</td>
            </tr>
            <tr>
                <td>Base lot size</td>
                <td className="e-text-right">{info.baseLotSize}</td>
            </tr>
            <tr>
                <td>Quote lot size</td>
                <td className="e-text-right">{info.quoteLotSize}</td>
            </tr>
            <tr>
                <td>Rate</td>
                <td className="e-text-right">{info.rate}</td>
            </tr>
            <tr>
                <td>Max depth bps</td>
                <td className="e-text-right">{info.maxDepthBps}</td>
            </tr>
            <tr>
                <td>MNGO per {formatDuration(info.targetPeriodLength, 'seconds')}</td>
                <td className="e-text-right">
                    {info.mngoPerPeriod} {}
                </td>
            </tr>
        </InstructionCard>
    );
}
