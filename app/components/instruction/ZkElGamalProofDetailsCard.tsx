import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { ZK_ELGAMAL_PROOF_PROGRAM_ID } from '@utils/programs';
import React from 'react';

import { InstructionCard } from './InstructionCard';

// Indexed by the 1-byte discriminator (0..=12).
const INSTRUCTION_NAMES: readonly string[] = [
    'Close Context State',
    'Verify Zero Ciphertext',
    'Verify Ciphertext-Ciphertext Equality',
    'Verify Ciphertext-Commitment Equality',
    'Verify Pubkey Validity',
    'Verify Percentage With Cap',
    'Verify Batched Range Proof (U64)',
    'Verify Batched Range Proof (U128)',
    'Verify Batched Range Proof (U256)',
    'Verify Grouped Ciphertext (2 handles)',
    'Verify Batched Grouped Ciphertext (2 handles)',
    'Verify Grouped Ciphertext (3 handles)',
    'Verify Batched Grouped Ciphertext (3 handles)',
];

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
    const instructionName = INSTRUCTION_NAMES[discriminator] ?? 'Unknown Instruction';
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
            <tr>
                <td>Program</td>
                <td className="e-text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            {ix.keys.map((meta, i) => (
                <tr key={i}>
                    <td>{labelFor(i, isClose, accountCount)}</td>
                    <td className="e-text-right">
                        <Address pubkey={meta.pubkey} alignRight link />
                    </td>
                </tr>
            ))}
            {!isClose && proofBytes > 0 && (
                <tr>
                    <td>Proof size</td>
                    <td className="e-text-right font-monospace">{proofBytes} bytes</td>
                </tr>
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
