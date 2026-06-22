import { Address } from '@components/common/Address';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { CancelOrderV2, SerumIxDetailsProps } from './types';

export function CancelOrderV2DetailsCard(props: SerumIxDetailsProps<CancelOrderV2>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: Cancel Order v2`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Market</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.market} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Bids</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.bids} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Asks</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.asks} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.openOrders} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.openOrdersOwner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Event Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.eventQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Side</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.side}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.orderId.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
