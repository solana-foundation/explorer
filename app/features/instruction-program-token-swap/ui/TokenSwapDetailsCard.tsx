import { InstructionCardView, type InstructionNode } from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';

import type { TokenSwapParsed } from '../lib/token-swap-parser';

type TokenSwapDetailsCardProps = {
    /** The dispatcher's verdict for a Token Swap instruction: named, or registered-but-unrecognized. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

/** Token Swap is decoded by name only, so raw hex is the whole content and the card opens on it. */
export function TokenSwapDetailsCard({ ix, raw, index, innerCards, childIndex }: TokenSwapDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };
    const name = 'unknown' in ix ? 'Unknown' : (ix.parsed as TokenSwapParsed).type;

    return <InstructionCardView node={node} title={`Token Swap: ${name}`} defaultRaw />;
}
