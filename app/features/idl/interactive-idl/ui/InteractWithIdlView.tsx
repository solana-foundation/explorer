import { getIdlSpec, getIdlVersion, type InstructionData, type SupportedIdl } from '@entities/idl';
import { useLayoutEffect, useState } from 'react';

import { Label } from '@/app/components/shared/ui/label';
import { Switch } from '@/app/components/shared/ui/switch';
import type { InstructionLogs } from '@/app/utils/program-logs';

import type { InstructionInvocationResult } from '../model/use-instruction';
import type { InstructionCallParams } from '../model/use-instruction-form';
import { ClusterSelector } from './ClusterSelector';
import { ConnectWallet } from './ConnectWallet';
import { InstructionActivity } from './InstructionActivity';
import { InteractInstructions } from './InteractInstructions';

export function InteractWithIdlView({
    instructions,
    idl,
    onExecuteInstruction,
    onTransactionSuccess,
    onTransactionError,
    preInvocationError,
    parseLogs,
    isExecuting,
    lastResult,
}: {
    instructions: InstructionData[];
    idl: SupportedIdl | undefined;
    onExecuteInstruction: (data: InstructionData, params: InstructionCallParams) => Promise<void>;
    onTransactionSuccess?: (txSignature: string) => void;
    onTransactionError?: (error: string) => void;
    parseLogs: (logs: string[]) => InstructionLogs[];
    isExecuting?: boolean;
    lastResult: InstructionInvocationResult;
    preInvocationError: string | null;
}) {
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    const allInstructionNames = instructions.map(instruction => instruction.name);

    const areAllExpanded =
        expandedSections.length === allInstructionNames.length &&
        allInstructionNames.every(name => expandedSections.includes(name));

    // Handle success state
    useLayoutEffect(() => {
        if (lastResult?.status === 'success' && !isExecuting) {
            onTransactionSuccess?.(lastResult.signature);
        }
    }, [lastResult, isExecuting, onTransactionSuccess]);

    // Handle error state
    useLayoutEffect(() => {
        if (lastResult?.status === 'error' && !isExecuting) {
            onTransactionError?.(lastResult.message);
        }
    }, [lastResult, isExecuting, onTransactionError]);

    useLayoutEffect(() => {
        if (preInvocationError && !isExecuting) {
            onTransactionError?.(preInvocationError);
        }
    }, [preInvocationError, isExecuting, onTransactionError]);

    const handleExpandAllToggle = (checked: boolean) => {
        const sections = checked ? allInstructionNames : [];
        setExpandedSections(sections);
    };

    return (
        <div className="e-container e-mx-auto e-px-4">
            {/* Main Grid Layout - responsive */}
            <div className="e-grid e-gap-6 md:e-grid-cols-12">
                {/* Interact Header */}
                <div className="e-flex e-items-center e-justify-between md:e-col-span-12">
                    <p className="e-mb-0 e-text-sm e-text-neutral-400">
                        Anchor{idl ? `: ${getIdlVersion(idl)}` : ''}
                        {idl && getIdlSpec(idl) ? ` (spec: ${getIdlSpec(idl)})` : ''}
                    </p>
                    <div className="e-flex e-items-center e-gap-3">
                        <Switch id="expand-all" checked={areAllExpanded} onCheckedChange={handleExpandAllToggle} />
                        <Label htmlFor="expand-all" className="e-cursor-pointer e-text-xs e-text-white">
                            Expand all
                        </Label>
                    </div>
                </div>

                {/* Left Column - Instructions */}
                <div className="e-order-2 md:e-order-1 md:e-col-span-6">
                    <InteractInstructions
                        instructions={instructions}
                        expandedSections={expandedSections}
                        setExpandedSections={setExpandedSections}
                        onExecuteInstruction={onExecuteInstruction}
                        isExecuting={isExecuting}
                    />
                </div>

                {/* Right Column - Controls & Logs */}
                <div className="e-order-1 e-h-full md:e-order-2 md:e-col-span-6">
                    <div className="e-top-4 md:e-sticky">
                        <div className="e-flex e-flex-col e-gap-y-4">
                            <ClusterSelector />

                            <ConnectWallet />

                            <InstructionActivity
                                lastResult={lastResult}
                                logs={lastResult?.logs ?? []}
                                parseLogs={parseLogs}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
