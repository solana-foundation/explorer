'use client';

import { InstructionCard } from '@components/instruction/InstructionCard';
import type { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { parseBatchInstruction, type ParsedSubInstruction } from '../lib/batch-parser';
import { useBatchDecimals } from '../model/use-batch-decimals';
import { SubInstructionRow } from './SubInstructionRow';

export function TokenBatchCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    // JSX.Element for compatibility with existing instruction card consumers
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { subInstructions, error }: { subInstructions: ParsedSubInstruction[]; error: string | undefined } = (() => {
        try {
            return { error: undefined, subInstructions: parseBatchInstruction(new Uint8Array(ix.data), ix.keys) };
        } catch (e) {
            return { error: e instanceof Error ? e.message : String(e), subInstructions: [] };
        }
    })();

    const decimalsMap = useBatchDecimals(subInstructions);
    const title = `Token Program: Batch (${subInstructions.length} instruction${subInstructions.length !== 1 ? 's' : ''})`;

    return (
        <InstructionCard title={title} {...{ childIndex, index, innerCards, ix, result }}>
            <tr>
                <td colSpan={3} className="e-p-0">
                    <div className="e-px-4 e-pb-2">
                        {error && (
                            <div className="e-mb-2 e-text-sm e-text-red-500" data-testid="batch-error">
                                Parse error: {error}
                            </div>
                        )}
                        {subInstructions.map(subIx => (
                            <SubInstructionRow
                                key={subIx.index}
                                subIx={subIx}
                                decimals={decimalsMap.get(subIx.index)}
                            />
                        ))}
                        {subInstructions.length === 0 && !error && (
                            <div className="e-text-sm e-text-neutral-500" data-testid="batch-empty">
                                No sub-instructions found
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </InstructionCard>
    );
}
