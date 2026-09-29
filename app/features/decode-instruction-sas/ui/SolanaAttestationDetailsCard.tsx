import {
    DecodedInstructionCard,
    InstructionCardView,
    type InstructionNode,
    parseCodamaArgs,
} from '@entities/instruction-card';
import type { DispatchResult } from '@entities/instruction-parser';
import type { TransactionInstruction } from '@solana/web3.js';
import { camelToTitleCase } from '@utils/index';

import type { SolanaAttestationParsed } from '../lib/sas-parser';

const TITLE_PREFIX = 'Solana Attestation';

type SolanaAttestationDetailsCardProps = {
    /** The dispatcher's verdict for a SAS instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
    /** Raw form, for the shell's account table and hex view. */
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function SolanaAttestationDetailsCard({
    ix,
    raw,
    index,
    innerCards,
    childIndex,
}: SolanaAttestationDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix: raw, programId: raw.programId };

    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const { info, type } = ix.parsed as SolanaAttestationParsed;

    return (
        <DecodedInstructionCard
            node={node}
            ix={raw}
            title={`${TITLE_PREFIX}: ${camelToTitleCase(type)}`}
            accountNames={Object.keys(info.accounts)}
            args={parseCodamaArgs(info.data)}
        />
    );
}
