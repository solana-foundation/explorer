import { DecodedInstructionCard, parseCodamaArgs } from '@entities/instruction-card';
import { type ParsedInstruction, type TransactionInstruction } from '@solana/web3.js';

import { withFormattedOperators } from '../lib/format-operators';
import type { LighthouseInfo, LighthouseInstructionType } from '../lib/types';

/**
 * Presentational card for a Lighthouse instruction already decoded by the
 * unified dispatcher. `ix` carries the canonical `{ type, info }` payload;
 * `raw` provides the full ordered account list (with roles) for the table.
 */
export function LighthouseDetailsCard({
    ix,
    raw,
    index,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction;
    raw: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const title = ix.parsed.type as LighthouseInstructionType;
    const info = ix.parsed.info as LighthouseInfo;
    const programName = 'Lighthouse';

    return (
        <DecodedInstructionCard
            node={{ childIndex, index, innerCards, ix: raw, programId: raw.programId }}
            ix={raw}
            title={`${programName}: ${title}`}
            programName={programName}
            accountNames={Object.keys(info.accounts ?? {})}
            args={parseCodamaArgs(withFormattedOperators(info.data))}
        />
    );
}
