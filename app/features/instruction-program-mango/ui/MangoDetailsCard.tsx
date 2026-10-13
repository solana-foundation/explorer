import { InstructionCardView, type InstructionNode } from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import { useCluster } from '@providers/cluster';
import type { TransactionInstruction } from '@solana/web3.js';
import { getProgramName } from '@utils/tx';

import type { MangoParsed } from '../lib/mango-parser';

type MangoDetailsCardProps = {
    /** The dispatcher's verdict for a Mango instruction: named, or registered-but-unrecognized. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

/** Mango v3 is deprecated and decoded by name only, so raw hex is the whole content and the card opens on it. */
export function MangoDetailsCard({ ix, raw, index, innerCards, childIndex }: MangoDetailsCardProps) {
    const { cluster } = useCluster();
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };
    const name = 'unknown' in ix ? unknownName(raw) : (ix.parsed as MangoParsed).type;

    return (
        <InstructionCardView
            node={node}
            title={`${getProgramName(raw.programId.toBase58(), cluster)}: ${name}`}
            defaultRaw
        />
    );
}

function unknownName(raw: TransactionInstruction): string {
    return raw.data.length === 0 ? 'No data' : 'Unknown';
}
