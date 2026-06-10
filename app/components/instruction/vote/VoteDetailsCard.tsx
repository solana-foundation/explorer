import { Address } from '@components/common/Address';
import { InstructionDetailsProps } from '@features/transaction';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { displayTimestamp } from '@utils/date';
import { camelToTitleCase } from '@utils/index';
import { ParsedInfo } from '@validators/index';
import React from 'react';
import { create, Struct } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import {
    AuthorizeInfo,
    UpdateCommissionInfo,
    UpdateValidatorInfo,
    VoteInfo,
    VoteSwitchInfo,
    WithdrawInfo,
} from './types';

export function VoteDetailsCard(props: InstructionDetailsProps) {
    const { url } = useCluster();

    try {
        const parsed = create(props.ix.parsed, ParsedInfo);

        switch (parsed.type) {
            case 'vote':
                return renderDetails<VoteInfo>(props, parsed, VoteInfo);
            case 'authorize':
                return renderDetails<AuthorizeInfo>(props, parsed, AuthorizeInfo);
            case 'withdraw':
                return renderDetails<WithdrawInfo>(props, parsed, WithdrawInfo);
            case 'updateValidator':
                return renderDetails<UpdateValidatorInfo>(props, parsed, UpdateValidatorInfo);
            case 'updateCommission':
                return renderDetails<UpdateCommissionInfo>(props, parsed, UpdateCommissionInfo);
            case 'voteSwitch':
                return renderDetails<VoteSwitchInfo>(props, parsed, VoteSwitchInfo);
        }
    } catch (error) {
        Logger.error(error, {
            url,
        });
    }

    return <UnknownDetailsCard {...props} />;
}

function renderDetails<T extends object>(props: InstructionDetailsProps, parsed: ParsedInfo, struct: Struct<T>) {
    const info = create(parsed.info, struct);
    const attributes: JSX.Element[] = [];

    for (const entry of Object.entries<any>(info)) {
        const key = entry[0];
        let value = entry[1];
        if (value instanceof PublicKey) {
            value = <Address pubkey={value} alignRight link />;
        }

        if (key === 'vote') {
            attributes.push(
                <BaseTable.Row key="vote-hash">
                    <BaseTable.Cell>Vote Hash</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <pre className="e-mb-0 e-inline-block e-text-left">{value.hash}</pre>
                    </BaseTable.Cell>
                </BaseTable.Row>,
            );

            if (value.timestamp) {
                attributes.push(
                    <BaseTable.Row key="timestamp">
                        <BaseTable.Cell>Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right e-font-mono">
                            {displayTimestamp(value.timestamp * 1000)}
                        </BaseTable.Cell>
                    </BaseTable.Row>,
                );
            }

            attributes.push(
                <BaseTable.Row key="vote-slots">
                    <BaseTable.Cell>Slots</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right e-font-mono">
                        <pre className="e-mb-0 e-inline-block e-text-left">{value.slots.join('\n')}</pre>
                    </BaseTable.Cell>
                </BaseTable.Row>,
            );
        } else {
            attributes.push(
                <BaseTable.Row key={key}>
                    <BaseTable.Cell>{camelToTitleCase(key)} </BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">{value}</BaseTable.Cell>
                </BaseTable.Row>,
            );
        }
    }

    return (
        <InstructionCard {...props} title={`Vote: ${camelToTitleCase(parsed.type)}`}>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={props.ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {attributes}
        </InstructionCard>
    );
}
