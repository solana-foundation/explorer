import { InstructionCard } from '@components/instruction/InstructionCard';
import type { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import type { ParsedTokenInstruction } from '@solana-program/token';

import { parseBatchInstruction } from '../lib/batch-parser';
import { BatchMintRegistryProvider } from '../model/batch-mint-registry';
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
    const { instructions, error }: { instructions: ParsedTokenInstruction<string>[]; error: string | undefined } =
        (() => {
            try {
                return { error: undefined, instructions: parseBatchInstruction(ix).instructions };
            } catch (e) {
                return { error: e instanceof Error ? e.message : String(e), instructions: [] };
            }
        })();

    const title = `Token Program: Batch (${instructions.length} instruction${instructions.length !== 1 ? 's' : ''})`;

    return (
        <InstructionCard title={title} collapsible {...{ childIndex, index, innerCards, ix, result }}>
            <tr>
                <td colSpan={3} className="e-p-0">
                    <div className="e-pb-2">
                        {error && (
                            <div className="e-mb-2 e-text-sm e-text-red-500" data-testid="batch-error">
                                Parse error: {error}
                            </div>
                        )}
                        {instructions.length > 0 && (
                            <BatchMintRegistryProvider>
                                {instructions.map((parsed, i) => (
                                    <SubInstructionRow key={i} parsed={parsed} index={i} />
                                ))}
                            </BatchMintRegistryProvider>
                        )}
                        {instructions.length === 0 && !error && (
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
