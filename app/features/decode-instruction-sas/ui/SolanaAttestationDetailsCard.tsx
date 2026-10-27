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
    /** The account rows come from `raw`. */
    node: InstructionNode & { raw: TransactionInstruction };
    /** The dispatcher's verdict for a SAS instruction: decoded, or registered-but-unparsed. */
    ix: DispatchResult;
};

export function SolanaAttestationDetailsCard({ node, ix }: SolanaAttestationDetailsCardProps) {
    if ('unknown' in ix) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} defaultRaw />;
    }

    const { info, type } = ix.parsed as SolanaAttestationParsed;

    return (
        <DecodedInstructionCard
            node={node}
            ix={node.raw}
            title={`${TITLE_PREFIX}: ${camelToTitleCase(type)}`}
            accountNames={Object.keys(info.accounts)}
            args={parseCodamaArgs(info.data)}
        />
    );
}
