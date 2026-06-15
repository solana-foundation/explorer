import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { getSpotMarketFromInstruction, OrderLotDetails, PlaceSpotOrder } from '@explorer/decoder-mango';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { useMemo } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { useMangoSpotMarket } from '../model/use-mango-market';

export function PlaceSpotOrderDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: PlaceSpotOrder;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoSpotMarketConfig = getSpotMarketFromInstruction(ix, info.spotMarket);
    const spotMarket = useMangoSpotMarket(ix.programId, mangoSpotMarketConfig);

    const orderLotDetails = useMemo<OrderLotDetails | undefined>(() => {
        if (!spotMarket) return undefined;
        return {
            price: spotMarket.priceLotsToNumber(new BN(info.limitPrice.toString())),
            size: spotMarket.baseSizeLotsToNumber(new BN(info.maxBaseQuantity.toString())),
        };
    }, [spotMarket, info.limitPrice, info.maxBaseQuantity]);

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Mango Program: PlaceSpotOrder"
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

            {mangoSpotMarketConfig !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Spot market</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{mangoSpotMarketConfig.name}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Spot market address</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={info.spotMarket.pubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order type</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.orderType}</BaseTable.Cell>
            </BaseTable.Row>

            {info.clientId !== '0' && (
                <BaseTable.Row>
                    <BaseTable.Cell>Client Id</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{info.clientId}</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Side</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.side}</BaseTable.Cell>
            </BaseTable.Row>

            {orderLotDetails !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Limit price</BaseTable.Cell>
                    {/* todo fix price */}
                    <BaseTable.Cell className="text-right">{orderLotDetails?.price} USDC</BaseTable.Cell>
                </BaseTable.Row>
            )}

            {orderLotDetails !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{orderLotDetails?.size}</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </InstructionCard>
    );
}
