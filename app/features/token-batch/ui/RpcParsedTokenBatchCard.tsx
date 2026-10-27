// Renders a Token / Token-2022 batch instruction that the Solana RPC has
// already parsed into structured JSON. Used when the transaction page receives
// a ParsedInstruction (type "batch") instead of a PartiallyDecodedInstruction
// with raw bytes. All parsing lives in lib/rpc-parsed-batch; this stays presentational.

import type { InstructionNode } from '@entities/instruction-card';
import type { ParsedInstruction } from '@solana/web3.js';

import { decodeRpcBatchInstructions } from '../lib/rpc-parsed-batch';
import { BatchInstructionCard } from './BatchInstructionCard';
import { SubInstructionRowView } from './SubInstructionRow';

export function RpcParsedTokenBatchCard({ node, ix }: { node: InstructionNode; ix: ParsedInstruction }) {
    const instructions = decodeRpcBatchInstructions(ix);

    return (
        <BatchInstructionCard node={node} count={instructions.length}>
            {instructions.map((sub, i) => (
                <SubInstructionRowView key={i} index={i} typeName={sub.typeName} decoded={sub.decoded} />
            ))}
        </BatchInstructionCard>
    );
}
