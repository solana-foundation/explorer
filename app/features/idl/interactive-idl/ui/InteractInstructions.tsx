import type { InstructionData, SupportedIdl } from '@entities/idl';
import { type Dispatch, type SetStateAction, useCallback } from 'react';

import type { InstructionCallParams } from '../model/use-instruction-form';
import { Accordion } from './Accordion';
import { InteractInstruction } from './InteractInstruction';

export function InteractInstructions({
    idl,
    expandedSections,
    setExpandedSections,
    instructions,
    onExecuteInstruction,
    onSectionsExpanded,
    isExecuting = false,
}: {
    idl: SupportedIdl | undefined;
    expandedSections: string[];
    setExpandedSections: Dispatch<SetStateAction<string[]>>;
    instructions: InstructionData[];
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onSectionsExpanded?: (expandedSections: string[], programId?: string) => void;
    isExecuting?: boolean;
}) {
    const handleValueChange = useCallback(
        (value: string[]) => {
            setExpandedSections(value);
            onSectionsExpanded?.(value);
        },
        [onSectionsExpanded, setExpandedSections]
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
