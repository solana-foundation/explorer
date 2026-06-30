import { type ParsedInstruction, PublicKey, type SignatureResult, type TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { CodamaInstructionBody } from '@/app/components/instruction/codama/CodamaInstructionBody';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS } from '../lib/constants';
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
    result,
    innerCards,
    childIndex,
}: {
    ix: ParsedInstruction;
    raw: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const title = ix.parsed.type as LighthouseInstructionType;
    const info = ix.parsed.info as LighthouseInfo;
    const kitIx = toKitInstruction(raw);

    return (
        <InstructionCard title={`Lighthouse: ${title}`} {...{ childIndex, index, innerCards, ix: raw, result }}>
            <CodamaInstructionBody
                programId={new PublicKey(LIGHTHOUSE_ADDRESS)}
                programName="Lighthouse"
                accounts={kitIx.accounts ?? []}
                namedAccounts={info.accounts}
                data={withFormattedOperators(info.data)}
            />
        </InstructionCard>
    );
}
