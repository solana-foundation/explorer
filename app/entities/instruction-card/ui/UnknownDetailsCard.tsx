import { useCluster } from '@providers/cluster';
import { getProgramName } from '@utils/tx';

import type { InstructionNode } from '../model/node';
import { InstructionCardView } from './InstructionCardView';

export function UnknownDetailsCard({ node }: { node: InstructionNode }) {
    const { cluster } = useCluster();
    const programName = getProgramName(node.programId.toBase58(), cluster);

    return <InstructionCardView node={node} title={`${programName}: Unknown Instruction`} defaultRaw />;
}
