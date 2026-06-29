'use client';

import { useVisibility } from '@/app/shared/lib/visibility';

import { useResolvedInstructionSummaries } from '../model/use-resolved-instruction-summaries';
import { InstructionList, InstructionListSkeleton } from './InstructionList';

// Per-row instruction list, fetched lazily once the row scrolls into view (the queued, one-at-a-time
// fetch keeps the page from hammering the RPC). undefined = still loading → skeleton; [] = nothing to show.
export function InstructionsCell({ signature }: { signature: string }) {
    const { isVisible, ref } = useVisibility<HTMLDivElement>(true);
    const instructions = useResolvedInstructionSummaries(signature, isVisible);

    return (
        <div ref={ref}>
            {instructions === undefined ? (
                <InstructionListSkeleton />
            ) : (
                instructions.length > 0 && <InstructionList instructions={instructions} />
            )}
        </div>
    );
}
