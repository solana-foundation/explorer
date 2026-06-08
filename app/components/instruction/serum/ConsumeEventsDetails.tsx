import { Address } from '@components/common/Address';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { ConsumeEvents, SerumIxDetailsProps } from './types';

export function ConsumeEventsDetailsCard(props: SerumIxDetailsProps<ConsumeEvents>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: Consume Events`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Market</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.market} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Event Queue</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.eventQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Accounts</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    {info.accounts.openOrders.map((account, index) => {
                        return <Address pubkey={account} key={index} alignRight link />;
                    })}
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Limit</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.limit}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
