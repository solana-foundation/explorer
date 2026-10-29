import { useCluster } from '@providers/cluster';
import { getProgramName } from '@utils/tx';

import type { InstructionNode } from '../model/node';
import { InstructionCardView } from './InstructionCardView';

type NameOnlyDetailsCardProps = {
    node: InstructionNode;
    /** Resolved instruction name; omitted when the program is known but the instruction is not. */
    name?: string;
    /** Title prefix; defaults to the program registry name. */
    programName?: string;
};

/** Card for a program whose instructions resolve to a name but carry no decoded fields, so it opens on raw data. */
export function NameOnlyDetailsCard({ node, name = 'Unknown', programName }: NameOnlyDetailsCardProps) {
    const { cluster } = useCluster();
    const title = `${programName ?? getProgramName(node.programId.toBase58(), cluster)}: ${name}`;

    return <InstructionCardView node={node} title={title} />;
}
