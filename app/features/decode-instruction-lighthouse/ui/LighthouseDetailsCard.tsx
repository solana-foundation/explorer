import { DecodedInstructionCard, parseCodamaArgs, type RawInstructionNode } from '@entities/instruction-card';
import type { ParsedInstructionInfo } from '@entities/instruction-parser';

import { withFormattedOperators } from '../lib/format-operators';
import type { LighthouseInfo, LighthouseInstructionType } from '../lib/types';

/**
 * Presentational card for a Lighthouse instruction already decoded by the
 * unified dispatcher. `parsed` carries the canonical `{ type, info }` payload;
 * `node.raw` provides the full ordered account list (with roles) for the table.
 */
export function LighthouseDetailsCard({ node, parsed }: { node: RawInstructionNode; parsed: ParsedInstructionInfo }) {
    const title = parsed.type as LighthouseInstructionType;
    const info = parsed.info as LighthouseInfo;
    const programName = 'Lighthouse';

    return (
        <DecodedInstructionCard
            node={node}
            title={`${programName}: ${title}`}
            programName={programName}
            accountNames={Object.keys(info.accounts ?? {})}
            args={parseCodamaArgs(withFormattedOperators(info.data))}
        />
    );
}
