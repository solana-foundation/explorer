import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import { wrap } from '@utils/index';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from './InstructionCard';

export function MemoDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const data = wrap(ix.parsed, 50);
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Memo Program: Memo"
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
                <BaseTable.Cell>Data (UTF-8)</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <pre className="e-mb-0 e-inline-block e-text-left">{data}</pre>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
