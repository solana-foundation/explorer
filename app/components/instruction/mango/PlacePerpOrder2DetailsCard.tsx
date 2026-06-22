import { Address } from '@components/common/Address';
import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { useEffect, useState } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import {
    getPerpMarketFromInstruction,
    getPerpMarketFromPerpMarketConfig,
    OrderLotDetails,
    PlacePerpOrder2,
} from './types';

export function PlacePerpOrder2DetailsCard(props: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: PlacePerpOrder2;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;
    const mangoAccount = ix.keys[1];
    const perpMarketAccountMeta = ix.keys[4];
    const mangoPerpMarketConfig = getPerpMarketFromInstruction(ix, perpMarketAccountMeta);

    const cluster = useCluster();
    const [orderLotDetails, setOrderLotDetails] = useState<OrderLotDetails | null>(null);
    useEffect(() => {
        async function getOrderLotDetails() {
            if (mangoPerpMarketConfig === undefined) {
                return;
            }
            const mangoPerpMarket = await getPerpMarketFromPerpMarketConfig(cluster.url, mangoPerpMarketConfig);
            const maxBaseQuantity = mangoPerpMarket.baseLotsToNumber(new BN(info.maxBaseQuantity.toString()));
            const limitPrice = mangoPerpMarket.priceLotsToNumber(new BN(info.price.toString()));
            setOrderLotDetails({
                price: limitPrice,
                size: maxBaseQuantity,
            } as OrderLotDetails);
        }
        getOrderLotDetails();
    }, [cluster.url, info.maxBaseQuantity, info.price, mangoPerpMarketConfig]);

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
                    <Address pubkey={mangoAccount.pubkey} alignRight link />
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
                    <Address pubkey={perpMarketAccountMeta.pubkey} alignRight link />
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
            {orderLotDetails !== null && (
                <BaseTable.Row>
                    <BaseTable.Cell>price</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{orderLotDetails?.price} USDC</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {orderLotDetails !== null && (
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
