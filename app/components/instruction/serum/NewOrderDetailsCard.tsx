import { Address } from '@components/common/Address';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { NewOrder, SerumIxDetailsProps } from './types';

export function NewOrderDetailsCard(props: SerumIxDetailsProps<NewOrder>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: New Order`}
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
                <BaseTable.Cell>Open Orders</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.openOrders} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Request Queue</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.requestQueue} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Payer</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.payer} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Open Orders Owner</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.openOrdersOwner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Base Vault</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.baseVault} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Quote Vault</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.accounts.quoteVault} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Side</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.side}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Order Type</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.orderType}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Limit Price</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.limitPrice.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Max Quantity</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.maxQuantity.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Client Id</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.data.clientId.toString(10)}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
