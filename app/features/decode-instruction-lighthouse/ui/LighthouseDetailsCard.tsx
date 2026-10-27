import { DecodedInstructionCard, type InstructionNode, parseCodamaArgs } from '@entities/instruction-card';
import { type ParsedInstruction, type TransactionInstruction } from '@solana/web3.js';

import { withFormattedOperators } from '../lib/format-operators';
import type { LighthouseInfo, LighthouseInstructionType } from '../lib/types';

/**
 * Presentational card for a Lighthouse instruction already decoded by the
 * unified dispatcher. `ix` carries the canonical `{ type, info }` payload;
 * `node.raw` provides the full ordered account list (with roles) for the table.
 */
export function LighthouseDetailsCard({
    node,
    ix,
}: {
    node: InstructionNode & { raw: TransactionInstruction };
    ix: ParsedInstruction;
}) {
    const title = ix.parsed.type as LighthouseInstructionType;
    const info = ix.parsed.info as LighthouseInfo;
    const programName = 'Lighthouse';

    return (
        <DecodedInstructionCard
            node={node}
            ix={node.raw}
            title={`${programName}: ${title}`}
            programName={programName}
            accountNames={Object.keys(info.accounts ?? {})}
            args={parseCodamaArgs(withFormattedOperators(info.data))}
        />
    );
}
