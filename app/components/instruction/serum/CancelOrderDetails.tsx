import { Address } from '@components/common/Address';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { CancelOrder, SerumIxDetailsProps } from './types';

export function CancelOrderDetailsCard(props: SerumIxDetailsProps<CancelOrder>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: Cancel Order`}
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
                <BaseTable.Cell>Request Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.requestQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Side</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.side}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Slot</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.openOrdersSlot}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.orderId.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
