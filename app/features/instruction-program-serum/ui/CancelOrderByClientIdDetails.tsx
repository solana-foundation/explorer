import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { CancelOrderByClientId, getSerumInstructionLabel } from '@explorer/decoder-serum';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { SerumIxDetailsProps } from './types';

export function CancelOrderByClientIdDetailsCard(props: SerumIxDetailsProps<CancelOrderByClientId>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: ${getSerumInstructionLabel(ix)}`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
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
                <BaseTable.Cell>Request Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.requestQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.openOrdersOwner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Client Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.clientId.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
