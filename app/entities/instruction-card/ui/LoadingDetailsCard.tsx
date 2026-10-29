import { useCluster } from '@providers/cluster';
import { getProgramName } from '@utils/tx';

import { note } from '../model/fields';
import type { InstructionNode } from '../model/node';
import { InstructionCardView } from './InstructionCardView';
import { InstructionFields } from './InstructionFields';

/** Stands in for a card whose code is still loading, so the instruction keeps its frame and its position. */
export function LoadingDetailsCard({ node }: { node: InstructionNode }) {
    const { cluster } = useCluster();
    const programName = getProgramName(node.programId.toBase58(), cluster);

    return (
        <InstructionCardView node={node} title={`${programName}: Loading`}>
            <InstructionFields fields={[note('Loading instruction details...')]} programId={node.programId} />
        </InstructionCardView>
    );
}
