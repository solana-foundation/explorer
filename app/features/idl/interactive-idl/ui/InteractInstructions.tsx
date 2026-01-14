import type { InstructionData, SupportedIdl } from '@entities/idl';
import { useAtomValue } from 'jotai';
import { type Dispatch, type SetStateAction, useCallback } from 'react';

import { idlAnalytics } from '@/app/utils/analytics';

import { programIdAtom } from '../model/state-atoms';
import type { InstructionCallParams } from '../model/use-instruction-form';
import { Accordion } from './Accordion';
import { InteractInstruction } from './InteractInstruction';

export function InteractInstructions({
    idl,
    expandedSections,
    setExpandedSections,
    instructions,
    onExecuteInstruction,
    isExecuting = false,
}: {
    idl: SupportedIdl | undefined;
    expandedSections: string[];
    setExpandedSections: Dispatch<SetStateAction<string[]>>;
    instructions: InstructionData[];
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    isExecuting?: boolean;
}) {
    const progId = useAtomValue(programIdAtom);

    const handleValueChange = useCallback(
        (value: string[]) => {
            const newlyExpanded = value.filter(section => !expandedSections.includes(section));
            newlyExpanded.forEach(instructionName => {
                idlAnalytics.trackInstructionExpanded(instructionName, progId?.toString());
            });

            setExpandedSections(value);
        },
        [expandedSections, progId, setExpandedSections]
    );

    return (
        <Accordion type="multiple" value={expandedSections} onValueChange={handleValueChange} className="e-space-y-4">
            {instructions.map(instruction => (
                <InteractInstruction
                    key={instruction.name}
                    idl={idl}
                    instruction={instruction}
                    onExecuteInstruction={onExecuteInstruction}
                    isExecuting={isExecuting}
                />
            ))}
        </Accordion>
    );
}
