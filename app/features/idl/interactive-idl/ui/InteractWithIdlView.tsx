import { type InstructionData, type SupportedIdl } from '@entities/idl';
import { useState } from 'react';

import { Label } from '@/app/components/shared/ui/label';
import { Switch } from '@/app/components/shared/ui/switch';

import type {
    ExecutionOptions,
    InstructionExecutionResult,
    InstructionSimulationResult,
} from '../model/transaction/types';
import type { InstructionStatus } from '../model/use-instruction';
import type { InstructionCallParams } from '../model/use-instruction-form';
import { ClusterSelector } from './ClusterSelector';
import { ConnectWallet } from './ConnectWallet';
import { InstructionExecutionActivity, InstructionSimulationActivity } from './InstructionActivity';
import { InteractInstructions } from './InteractInstructions';

// FIXME: missing Storybook story — composes ConnectWallet + ClusterSelector + InteractInstructions; inherits wallet/cluster provider need.
export function InteractWithIdlView({
    instructions,
    idl,
    onExecuteInstruction,
    onSimulateInstruction,
    onSectionsExpanded,
    status,
    lastExecutionResult,
    lastSimulationResult,
    lastAction,
}: {
    instructions: InstructionData[];
    idl: SupportedIdl | undefined;
    onExecuteInstruction: (
        data: InstructionData,
        params: InstructionCallParams,
        options: ExecutionOptions,
    ) => Promise<void>;
    onSimulateInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onSectionsExpanded?: (expandedSections: string[], programId?: string) => void;
    status?: InstructionStatus;
    lastExecutionResult: InstructionExecutionResult | undefined;
    lastSimulationResult: InstructionSimulationResult | undefined;
    lastAction: 'execute' | 'simulate' | null;
}) {
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    const allInstructionNames = instructions.map(instruction => instruction.name);

    const areAllExpanded =
        expandedSections.length === allInstructionNames.length &&
        allInstructionNames.every(name => expandedSections.includes(name));

    const handleExpandAllToggle = (checked: boolean) => {
        const sections = checked ? allInstructionNames : [];
        setExpandedSections(sections);
        onSectionsExpanded?.(sections);
    };

    return (
        <div className="container mx-auto px-4">
            {/* Main Grid Layout - responsive */}
            <div className="grid gap-6 md:grid-cols-12">
                {/* Interact Header — the IDL standard / version label now lives in the card's badge. */}
                <div className="flex items-center justify-end md:col-span-12">
                    <div className="flex items-center gap-3">
                        <Switch id="expand-all" checked={areAllExpanded} onCheckedChange={handleExpandAllToggle} />
                        <Label htmlFor="expand-all" className="cursor-pointer text-xs text-white">
                            Expand all
                        </Label>
                    </div>
                </div>

                {/* Left Column - Instructions */}
                <div className="order-2 min-w-0 md:order-1 md:col-span-6">
                    <InteractInstructions
                        idl={idl}
                        instructions={instructions}
                        expandedSections={expandedSections}
                        setExpandedSections={setExpandedSections}
                        onExecuteInstruction={onExecuteInstruction}
                        onSimulateInstruction={onSimulateInstruction}
                        onSectionsExpanded={onSectionsExpanded}
                        status={status}
                    />
                </div>

                {/* Right Column - Controls & Logs */}
                <div className="order-1 h-full min-w-0 md:order-2 md:col-span-6">
                    <div className="top-4 md:sticky">
                        <div className="flex flex-col gap-y-4">
                            <ClusterSelector />

                            <ConnectWallet />

                            {lastAction === 'simulate' ? (
                                <InstructionSimulationActivity lastSimulation={lastSimulationResult} />
                            ) : (
                                <InstructionExecutionActivity lastResult={lastExecutionResult} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
