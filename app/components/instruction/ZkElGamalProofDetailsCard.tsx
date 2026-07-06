import { Address } from '@components/common/Address';
import { getZkElGamalProofAccountLabel, parseZkElGamalProofInstruction } from '@entities/zk-elgamal-proof';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from './InstructionCard';

export function ZkElGamalProofDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const { name, isCloseContextState, proofByteLength } = parseZkElGamalProofInstruction(ix.data);
    const accountCount = ix.keys.length;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title={`ZK ElGamal Proof Program: ${name}`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {ix.keys.map((meta, i) => (
                <BaseTable.Row key={i}>
                    <BaseTable.Cell>
                        {getZkElGamalProofAccountLabel(i, { accountCount, isCloseContextState })}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={meta.pubkey} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
            {!isCloseContextState && proofByteLength > 0 && (
                <BaseTable.Row>
                    <BaseTable.Cell>Proof size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right font-mono">{proofByteLength} bytes</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </InstructionCardComponent>
    );
}
