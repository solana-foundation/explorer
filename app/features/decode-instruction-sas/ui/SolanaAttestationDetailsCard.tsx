import {
    DecodedInstructionCard,
    InstructionCardView,
    parseCodamaArgs,
    type RawInstructionNode,
} from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import { camelToTitleCase } from '@utils/index';

import type { SolanaAttestationParsed } from '../lib/sas-parser';

const TITLE_PREFIX = 'Solana Attestation';

type SolanaAttestationDetailsCardProps = {
    /** The account rows come from `raw`. */
    node: RawInstructionNode;
    /** `undefined` when the parser of the program cannot decode the instruction. */
    parsed: ParsedInstructionInfo | undefined;
};

export function SolanaAttestationDetailsCard({ node, parsed }: SolanaAttestationDetailsCardProps) {
    if (!parsed) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX}: Unknown Instruction`} />;
    }

    const { info, type } = parsed as SolanaAttestationParsed;

    return (
        <DecodedInstructionCard
            node={node}
            title={`${TITLE_PREFIX}: ${camelToTitleCase(type)}`}
            accountNames={Object.keys(info.accounts)}
            args={parseCodamaArgs(info.data)}
        />
    );
}
