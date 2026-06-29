import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AddPriceParams, PriceType } from './program';

export default function AddPriceDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: AddPriceParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Pyth: Add Price Account"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Funding Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.fundingPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Product Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.productPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Price Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.pricePubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Exponent</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.exponent}</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Price Type</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{PriceType[info.priceType]}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
