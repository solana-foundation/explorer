import { InstructionFieldRows, type RawInstructionNode, text } from '@entities/instruction-card';

import { parseBatchInstruction, type ParsedSubInstruction } from '../lib/batch-parser';
import { BatchMintRegistryProvider } from '../model/batch-mint-registry';
import { BatchInstructionCard } from './BatchInstructionCard';
import { SubInstructionRow } from './SubInstructionRow';

export function TokenBatchCard({ node }: { node: RawInstructionNode }) {
    const { instructions, error }: { instructions: ParsedSubInstruction[]; error: string | undefined } = (() => {
        try {
            return { error: undefined, instructions: parseBatchInstruction(node.raw).instructions };
        } catch (e) {
            return { error: e instanceof Error ? e.message : String(e), instructions: [] };
        }
    })();

    return (
        <BatchInstructionCard node={node} count={instructions.length}>
            {error && <InstructionFieldRows fields={[text('Parse Error', error)]} />}
            <BatchMintRegistryProvider>
                {instructions.map((sub, i) => (
                    <SubInstructionRow key={i} parsed={sub.parsed} extraSigners={sub.extraSigners} index={i} />
                ))}
            </BatchMintRegistryProvider>
        </BatchInstructionCard>
    );
}
