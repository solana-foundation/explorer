import type { InstructionNode } from '@entities/instruction-card';
import type { TransactionInstruction } from '@solana/web3.js';

import { parseBatchInstruction, type ParsedSubInstruction } from '../lib/batch-parser';
import { BatchMintRegistryProvider } from '../model/batch-mint-registry';
import { BatchInstructionCard } from './BatchInstructionCard';
import { SubInstructionRow } from './SubInstructionRow';

export function TokenBatchCard({ node, ix }: { node: InstructionNode; ix: TransactionInstruction }) {
    const { instructions, error }: { instructions: ParsedSubInstruction[]; error: string | undefined } = (() => {
        try {
            return { error: undefined, instructions: parseBatchInstruction(ix).instructions };
        } catch (e) {
            return { error: e instanceof Error ? e.message : String(e), instructions: [] };
        }
    })();

    return (
        <BatchInstructionCard node={node} count={instructions.length}>
            {error && (
                <div className="mb-2 text-sm text-red-500" data-testid="batch-error">
                    Parse error: {error}
                </div>
            )}
            {instructions.length > 0 && (
                <BatchMintRegistryProvider>
                    {instructions.map((sub, i) => (
                        <SubInstructionRow key={i} parsed={sub.parsed} extraSigners={sub.extraSigners} index={i} />
                    ))}
                </BatchMintRegistryProvider>
            )}
            {instructions.length === 0 && !error && (
                <div className="text-sm text-neutral-500" data-testid="batch-empty">
                    No sub-instructions found
                </div>
            )}
        </BatchInstructionCard>
    );
}
