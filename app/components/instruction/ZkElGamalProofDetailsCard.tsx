import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ZK_ELGAMAL_PROOF_PROGRAM_ID } from '@utils/programs';
import { getZkElGamalProofInstructionName } from '@utils/zk-elgamal-proof';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from './InstructionCard';

export function isZkElGamalProofInstruction(ix: TransactionInstruction): boolean {
    return ix.programId.toBase58() === ZK_ELGAMAL_PROOF_PROGRAM_ID;
}

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
    // Instruction data layout: [discriminator (1 byte), ...raw_proof_bytes].
    // For verify variants using a record/context-state account, raw_proof_bytes is
    // empty and the proof lives off-instruction; the row below stays hidden.
    const data = ix.data;
    const discriminator = data.length > 0 ? data[0] : -1;
    const instructionName = getZkElGamalProofInstructionName(discriminator);
    const isClose = discriminator === 0;
    const proofBytes = data.length > 1 ? data.length - 1 : 0;
    const accountCount = ix.keys.length;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title={`ZK ElGamal Proof Program: ${instructionName}`}
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
                    <BaseTable.Cell>{labelFor(i, isClose, accountCount)}</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={meta.pubkey} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
            {!isClose && proofBytes > 0 && (
                <BaseTable.Row>
                    <BaseTable.Cell>Proof size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right font-mono">{proofBytes} bytes</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </InstructionCardComponent>
    );
}

// Account layouts:
//   CloseContextState: [context_state, destination, authority]
//   Verify with proof in instruction data: []
//   Verify with record account: [record_account]
//   Verify with context state account: [context_state, context_state_authority]
function labelFor(idx: number, isClose: boolean, total: number): string {
    if (isClose) {
        if (idx === 0) return 'Context State Account';
        if (idx === 1) return 'Destination';
        if (idx === 2) return 'Authority';
        return `Account #${idx + 1}`;
    }
    if (total === 1 && idx === 0) return 'Record Account';
    if (total === 2) {
        if (idx === 0) return 'Context State Account';
        if (idx === 1) return 'Context State Authority';
    }
    return `Account #${idx + 1}`;
}
