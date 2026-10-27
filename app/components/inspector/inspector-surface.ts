import type { InstructionSurface } from '@entities/instruction-card';

import { InspectorInstructionCard } from '../common/InspectorInstructionCard';
import { InstructionNodeCard } from '../instruction/InstructionNodeCard';

export function inspectorSurface(instructionData: InstructionSurface['instructionData']): InstructionSurface {
    return {
        Card: InstructionNodeCard,
        Shell: InspectorInstructionCard,
        instructionData,
        // eslint-disable-next-line unicorn/no-null -- SignatureResult.err is `TransactionError | null`
        result: { err: null },
        signature: undefined,
    };
}
