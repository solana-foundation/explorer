import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { getSerumInstructionLabel, MatchOrders } from '@explorer/decoder-serum';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { SerumIxDetailsProps } from './types';

export function MatchOrdersDetailsCard(props: SerumIxDetailsProps<MatchOrders>) {
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
                <BaseTable.Cell>Request Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.requestQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Event Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.eventQueue} alignRight link />
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
                <BaseTable.Cell>Limit</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.limit}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
