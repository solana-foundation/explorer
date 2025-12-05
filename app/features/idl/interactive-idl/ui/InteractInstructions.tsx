import type { InstructionData } from '@entities/idl';
import { type Dispatch, type SetStateAction } from 'react';

import type { InstructionCallParams } from '../model/use-instruction-form';
import { Accordion } from './Accordion';
import { InteractInstruction } from './InteractInstruction';

export function InteractInstructions({
    expandedSections,
    setExpandedSections,
    instructions,
    onExecuteInstruction,
    isExecuting = false,
}: {
    expandedSections: string[];
    setExpandedSections: Dispatch<SetStateAction<string[]>>;
    instructions: InstructionData[];
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    isExecuting?: boolean;
}) {
    return (
        <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="e-space-y-4">
            {instructions.map(instruction => (
                <InteractInstruction
                    key={instruction.name}
                    instruction={instruction}
                    onExecuteInstruction={onExecuteInstruction}
                    isExecuting={isExecuting}
                />
            ))}
        </Accordion>
    );
}
