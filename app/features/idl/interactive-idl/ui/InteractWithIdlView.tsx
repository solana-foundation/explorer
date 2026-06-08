import { getIdlSpec, getIdlStandard, getIdlVersion, type InstructionData, type SupportedIdl } from '@entities/idl';
import { useState } from 'react';

import { Label } from '@/app/components/shared/ui/label';
import { Switch } from '@/app/components/shared/ui/switch';
import type { InstructionLogs } from '@/app/utils/program-logs';

import type { InstructionExecutionResult, InstructionSimulationResult } from '../model/transaction/types';
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
    parseLogs,
    parseSimulationLogs,
    isExecuting,
    isSimulating,
    lastResult,
    lastSimulation,
    lastAction,
}: {
    instructions: InstructionData[];
    idl: SupportedIdl | undefined;
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onSimulateInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onSectionsExpanded?: (expandedSections: string[], programId?: string) => void;
    parseLogs: (logs: string[]) => InstructionLogs[];
    parseSimulationLogs: (logs: string[]) => InstructionLogs[];
    isExecuting?: boolean;
    isSimulating?: boolean;
    lastResult: InstructionExecutionResult | undefined;
    lastSimulation: InstructionSimulationResult | undefined;
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
                {/* Interact Header */}
                <div className="flex items-center justify-between md:col-span-12">
                    {idl && (
                        <p className="mb-0 text-sm text-neutral-400">
                            {getIdlStandard(idl)}: {getIdlVersion(idl)}
                            {getIdlSpec(idl) ? ` (spec: ${getIdlSpec(idl)})` : ''}
                        </p>
                    )}
                    <div className="flex items-center gap-3">
                        <Switch id="expand-all" checked={areAllExpanded} onCheckedChange={handleExpandAllToggle} />
                        <Label htmlFor="expand-all" className="cursor-pointer text-xs text-white">
                            Expand all
                        </Label>
                    </div>
                </div>

                {/* Left Column - Instructions */}
                <div className="order-2 md:order-1 md:col-span-6">
                    <InteractInstructions
                        idl={idl}
                        instructions={instructions}
                        expandedSections={expandedSections}
                        setExpandedSections={setExpandedSections}
                        onExecuteInstruction={onExecuteInstruction}
                        onSimulateInstruction={onSimulateInstruction}
                        onSectionsExpanded={onSectionsExpanded}
                        isExecuting={isExecuting}
                        isSimulating={isSimulating}
                    />
                </div>

                {/* Right Column - Controls & Logs */}
                <div className="order-1 h-full md:order-2 md:col-span-6">
                    <div className="top-4 md:sticky">
                        <div className="flex flex-col gap-y-4">
                            <ClusterSelector />

                            <ConnectWallet />

                            {lastAction === 'simulate' ? (
                                <InstructionSimulationActivity
                                    lastSimulation={lastSimulation}
                                    parseLogs={parseSimulationLogs}
                                />
                            ) : (
                                <InstructionExecutionActivity lastResult={lastResult} parseLogs={parseLogs} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
