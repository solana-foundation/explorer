// Renders a Token / Token-2022 batch instruction that the Solana RPC has
// already parsed into structured JSON. Used when the transaction page receives
// a ParsedInstruction (type "batch") instead of a PartiallyDecodedInstruction
// with raw bytes. All parsing lives in lib/rpc-parsed-batch; this stays presentational.

import type { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import type { ReactNode } from 'react';

import { decodeRpcBatchInstructions } from '../lib/rpc-parsed-batch';
import { BatchInstructionCard } from './BatchInstructionCard';
import { SubInstructionRowView } from './SubInstructionRow';

export function RpcParsedTokenBatchCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
}) {
    const instructions = decodeRpcBatchInstructions(ix);

    return (
        <BatchInstructionCard {...{ childIndex, index, innerCards, ix, result }} count={instructions.length}>
            {instructions.length === 0 ? (
                <div className="text-sm text-neutral-500" data-testid="batch-empty">
                    No sub-instructions found
                </div>
            ) : (
                instructions.map((sub, i) => (
                    <SubInstructionRowView key={i} index={i} typeName={sub.typeName} decoded={sub.decoded} />
                ))
            )}
        </BatchInstructionCard>
    );
}
