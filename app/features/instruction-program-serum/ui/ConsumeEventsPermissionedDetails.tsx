import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { ConsumeEventsPermissioned } from '@explorer/decoder-serum';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { SerumIxDetailsProps } from './types';

export function ConsumeEventsPermissionedDetailsCard(props: SerumIxDetailsProps<ConsumeEventsPermissioned>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: Consume Events Permissioned`}
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
                <BaseTable.Cell>Event Queue</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.eventQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Crank Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.crankAuthority} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Accounts</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {info.accounts.openOrders.map((account, index) => {
                        return <Address pubkey={account} key={index} alignRight link />;
                    })}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Limit</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.data.limit}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
