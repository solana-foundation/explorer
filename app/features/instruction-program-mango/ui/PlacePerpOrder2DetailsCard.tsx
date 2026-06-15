import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { getPerpMarketFromInstruction, OrderLotDetails, PlacePerpOrder2 } from '@explorer/decoder-mango';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { useMemo } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { useMangoPerpMarket } from '../model/use-mango-market';

export function PlacePerpOrder2DetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: PlacePerpOrder2;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoPerpMarketConfig = getPerpMarketFromInstruction(ix, info.perpMarket);
    const perpMarket = useMangoPerpMarket(mangoPerpMarketConfig);

    const orderLotDetails = useMemo<OrderLotDetails | undefined>(() => {
        if (!perpMarket) return undefined;
        return {
            price: perpMarket.priceLotsToNumber(new BN(info.price.toString())),
            size: perpMarket.baseLotsToNumber(new BN(info.maxBaseQuantity.toString())),
        };
    }, [perpMarket, info.price, info.maxBaseQuantity]);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: PlacePerpOrder2"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Mango account</BaseTable.Cell>
                <BaseTable.Cell>
                    {' '}
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
            {info.clientOrderId !== '0' && (
                <BaseTable.Row>
                    <BaseTable.Cell>Client order Id</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.clientOrderId}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Order type</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.orderType}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Side</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.side}</BaseTable.Cell>
            </BaseTable.Row>
            {orderLotDetails !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>price</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{orderLotDetails?.price} USDC</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {orderLotDetails !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>quantity</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{orderLotDetails?.size}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Reduce only</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.reduceOnly}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Expiry timestamp</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.expiryTimestamp}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
