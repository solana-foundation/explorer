import { InstructionCardView, type InstructionNode } from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';

import type { WormholeParsed } from '../lib/wormhole-parser';

type WormholeDetailsCardProps = {
    /** The dispatcher's verdict for a Wormhole instruction: named, or registered-but-unrecognized. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

/** Wormhole is decoded by name only, so raw hex is the whole content and the card opens on it. */
export function WormholeDetailsCard({ ix, raw, index, innerCards, childIndex }: WormholeDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };
    const name = 'unknown' in ix ? 'Unknown' : (ix.parsed as WormholeParsed).type;

    return <InstructionCardView node={node} title={`Wormhole: ${name}`} defaultRaw />;
}
