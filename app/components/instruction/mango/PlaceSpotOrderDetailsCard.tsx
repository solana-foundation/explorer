import { Address } from '@components/common/Address';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { useEffect, useState } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import {
    getSpotMarketFromInstruction,
    getSpotMarketFromSpotMarketConfig,
    OrderLotDetails,
    PlaceSpotOrder,
} from '@explorer/decoder-mango';

export function PlaceSpotOrderDetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: PlaceSpotOrder;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[1];
    const spotMarketAccountMeta = ix.keys[5];
    const mangoSpotMarketConfig = getSpotMarketFromInstruction(ix, spotMarketAccountMeta);

    const cluster = useCluster();
    const [orderLotDetails, setOrderLotDetails] = useState<OrderLotDetails | null>(null);
    useEffect(() => {
        async function getOrderLotDetails() {
            if (mangoSpotMarketConfig === undefined) {
                return;
            }
            const mangoSpotMarket = await getSpotMarketFromSpotMarketConfig(
                ix.programId,
                cluster.url,
                mangoSpotMarketConfig,
            );
            if (mangoSpotMarket === undefined) {
                return;
            }
            const maxBaseQuantity = mangoSpotMarket.baseSizeLotsToNumber(new BN(info.maxBaseQuantity.toString()));
            const limitPrice = mangoSpotMarket.priceLotsToNumber(new BN(info.limitPrice.toString()));
            setOrderLotDetails({
                price: limitPrice,
                size: maxBaseQuantity,
            } as OrderLotDetails);
        }
        getOrderLotDetails();
    }, [cluster.url, info.maxBaseQuantity, info.limitPrice, ix.programId, mangoSpotMarketConfig]);

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

            {orderLotDetails !== null && (
                <BaseTable.Row>
                    <BaseTable.Cell>Limit price</BaseTable.Cell>
                    {/* todo fix price */}
                    <BaseTable.Cell className="text-right">{orderLotDetails?.price} USDC</BaseTable.Cell>
                </BaseTable.Row>
            )}

            {orderLotDetails !== null && (
                <BaseTable.Row>
                    <BaseTable.Cell>Size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{orderLotDetails?.size}</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </InstructionCard>
    );
}
