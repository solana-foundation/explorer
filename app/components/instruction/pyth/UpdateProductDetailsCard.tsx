import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { UpdateProductParams } from './program';

export default function UpdateProductDetailsCard({
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
    info: UpdateProductParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const attrsJSON = JSON.stringify(Object.fromEntries(info.attributes), null, 2);

    function Content() {
        return (
            <Copyable text={attrsJSON}>
                <pre className="e-mb-0 e-inline-block e-text-left">{attrsJSON}</pre>
            </Copyable>
        );
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Pyth: Update Product"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Funding Account</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.fundingPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Product Account</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.productPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>
                    Attributes <span className="text-muted">(JSON)</span>
                </BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <div className="d-lg-flex e-hidden e-items-center e-justify-end">
                        <Content />
                    </div>
                    <div className="e-flex e-items-center lg:e-hidden">
                        <Content />
                    </div>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
