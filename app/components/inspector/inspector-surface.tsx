import type { InstructionShellProps, InstructionSurface } from '@entities/instruction-card';

import { BaseInstructionCard } from '../common/BaseInstructionCard';
import { InstructionNodeCard } from '../instruction/InstructionNodeCard';

export function inspectorSurface(instructionData: InstructionSurface['instructionData']): InstructionSurface {
    return {
        Card: InstructionNodeCard,
        Shell: InspectorInstructionShell,
        instructionData,
        // eslint-disable-next-line unicorn/no-null -- SignatureResult.err is `TransactionError | null`
        result: { err: null },
        signature: undefined,
    };
}

// An inspected message has not run, so the Raw view checks the program it calls.
function InspectorInstructionShell(props: InstructionShellProps) {
    return <BaseInstructionCard {...props} collapsible validateProgram />;
}
