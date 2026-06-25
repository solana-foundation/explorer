import type { InstructionData, SupportedIdl } from '@entities/idl';
import { type Dispatch, type SetStateAction, useCallback } from 'react';

import type { ExecutionOptions } from '../model/transaction/types';
import type { InstructionCallParams } from '../model/use-instruction-form';
import { Accordion } from './Accordion';
import { InteractInstruction } from './InteractInstruction';

// FIXME: missing Storybook story — pure props, but renders InteractInstruction (useWallet) so inherits the wallet provider need.
export function InteractInstructions({
    idl,
    expandedSections,
    setExpandedSections,
    instructions,
    onExecuteInstruction,
    onSimulateInstruction,
    onSectionsExpanded,
    isExecuting = false,
    isSimulating = false,
}: {
    idl: SupportedIdl | undefined;
    expandedSections: string[];
    setExpandedSections: Dispatch<SetStateAction<string[]>>;
    instructions: InstructionData[];
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams, options: ExecutionOptions) => Promise<void>;
    onSimulateInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onSectionsExpanded?: (expandedSections: string[], programId?: string) => void;
    isExecuting?: boolean;
    isSimulating?: boolean;
}) {
    const handleValueChange = useCallback(
        (value: string[]) => {
            setExpandedSections(value);
            onSectionsExpanded?.(value);
        },
        [onSectionsExpanded, setExpandedSections],
    );

    return (
        <Accordion type="multiple" value={expandedSections} onValueChange={handleValueChange} className="space-y-4">
            {instructions.map(instruction => (
                <InteractInstruction
                    key={instruction.name}
                    idl={idl}
                    instruction={instruction}
                    onExecuteInstruction={onExecuteInstruction}
                    onSimulateInstruction={onSimulateInstruction}
                    isExecuting={isExecuting}
                    isSimulating={isSimulating}
                />
            ))}
        </Accordion>
    );
}
