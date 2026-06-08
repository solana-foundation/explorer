import { LoadingCard } from '@components/shared/LoadingCard';
import { useToast } from '@components/shared/ui/sonner/use-toast';
import type { InstructionData, SupportedIdl } from '@entities/idl';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { ExplorerLink } from '@/app/entities/cluster';
import { BaseWarningCard } from '@/app/shared/ui/WarningCard';

import { originalIdlAtom, programIdAtom } from '../model/state-atoms';
import { isEnabled, useInstruction } from '../model/use-instruction';
import type { InstructionCallParams } from '../model/use-instruction-form';
import { useMainnetConfirmation } from '../model/use-mainnet-confirmation';
import { InteractWithIdlView } from './InteractWithIdlView';
import { MainnetWarningDialog } from './MainnetWarningDialog';

export interface InteractWithIdlAnalyticsCallbacks {
    onSectionsExpanded?: (programId?: string, expandedSections?: string[]) => void;
    onTabOpened?: (programId?: string) => void;
    onTransactionConfirmed?: (programId?: string, instructionName?: string, signature?: string) => void;
    onTransactionFailed?: (programId?: string, instructionName?: string, error?: string) => void;
    onTransactionSimulationStart?: (programId?: string, instructionName?: string) => void;
    onTransactionExecutionStart?: (programId?: string, instructionName?: string) => void;
    onWalletConnected?: (programId?: string, walletType?: string) => void;
}

// FIXME: missing Storybook story — uses useWallet + jotai atoms (originalIdlAtom, programIdAtom).
export function InteractWithIdl({
    data: instructions,
    onSectionsExpanded,
    onTabOpened,
    onTransactionConfirmed,
    onTransactionFailed,
    onTransactionSimulationStart,
    onTransactionExecutionStart,
    onWalletConnected,
}: {
    data?: InstructionData[];
} & InteractWithIdlAnalyticsCallbacks) {
    const toast = useToast();
    const idl = useAtomValue(originalIdlAtom);
    const progId = useAtomValue(programIdAtom);
    const { connected, publicKey, wallet } = useWallet();

    const [currentInstruction, setCurrentInstruction] = useState<{ name: string; programId?: string } | null>(null);
    const [hasTrackedTabOpen, setHasTrackedTabOpen] = useState(false);
    const [hasTrackedWalletConnect, setHasTrackedWalletConnect] = useState(false);

    useEffect(() => {
        if (!hasTrackedTabOpen && progId) {
            onTabOpened?.(progId.toString());
            setHasTrackedTabOpen(true);
        }
    }, [progId, onTabOpened, hasTrackedTabOpen]);

    useEffect(() => {
        if (connected && !hasTrackedWalletConnect && progId) {
            const walletType = wallet?.adapter?.name;
            onWalletConnected?.(progId.toString(), walletType);
            setHasTrackedWalletConnect(true);
        }
    }, [connected, progId, wallet, onWalletConnected, hasTrackedWalletConnect]);

    const handleTransactionSuccess = useCallback(
        (txSignature: string) => {
            toast.custom({
                description: (
                    <ExplorerLink path={`/tx/${txSignature}`} className="shrink-0 text-xs" label="View Transaction" />
                ),
                title: 'Transaction is sent',
                type: 'success',
            });

            if (currentInstruction) {
                onTransactionConfirmed?.(currentInstruction.programId, currentInstruction.name, txSignature);
                setCurrentInstruction(null);
            }
        },
        [toast, currentInstruction, onTransactionConfirmed],
    );

    const handleTransactionError = useCallback(
        (error: string) => {
            toast.custom({ description: error, title: 'Transaction Failed', type: 'error' });

            if (currentInstruction) {
                onTransactionFailed?.(currentInstruction.programId, currentInstruction.name, error);
                setCurrentInstruction(null);
            }
        },
        [toast, currentInstruction, onTransactionFailed],
    );

    const {
        executeInstruction,
        simulateInstruction,
        initializationError,
        isExecuting,
        isSimulating,
        lastResult,
        lastSimulation,
        parseLogs,
        parseSimulationLogs,
    } = useInstruction({
        enabled: isEnabled({ connected, idl, programId: progId, publicKey }),
        idl,
        onError: handleTransactionError,
        onSuccess: handleTransactionSuccess,
        programId: progId?.toString(),
    });

    const [lastAction, setLastAction] = useState<'execute' | 'simulate' | null>(null);

    const { requireConfirmation, confirm, cancel, isOpen, hasPendingAction } = useMainnetConfirmation<{
        data: InstructionData;
        params: InstructionCallParams;
    }>();

    const handleExecuteInstruction = useCallback(
        async (data: InstructionData, params: InstructionCallParams) => {
            const programIdStr = progId?.toString();

            setLastAction('execute');
            onTransactionExecutionStart?.(programIdStr, data.name);

            setCurrentInstruction({ name: data.name, programId: programIdStr });

            await requireConfirmation(
                async () => {
                    await executeInstruction(data.name, data, params);
                },
                { data, params },
            );
        },
        [executeInstruction, requireConfirmation, progId, onTransactionExecutionStart],
    );

    const handleSimulateInstruction = useCallback(
        async (data: InstructionData, params: InstructionCallParams) => {
            const programIdStr = progId?.toString();
            setLastAction('simulate');
            onTransactionSimulationStart?.(programIdStr, data.name);
            await simulateInstruction(data.name, data, params);
        },
        [simulateInstruction, progId, onTransactionSimulationStart],
    );

    if (initializationError) {
        return (
            <BaseWarningCard
                message={`Unable to initialize program for interaction: ${initializationError}`}
                description="You can still view the IDL structure above."
            />
        );
    }

    return !(idl && progId) ? (
        <LoadingCard />
    ) : (
        <>
            <InteractWithIdlView
                instructions={instructions || []}
                idl={idl as SupportedIdl}
                onExecuteInstruction={handleExecuteInstruction}
                onSimulateInstruction={handleSimulateInstruction}
                onSectionsExpanded={expandedSections => {
                    onSectionsExpanded?.(progId?.toString(), expandedSections);
                }}
                isExecuting={isExecuting}
                isSimulating={isSimulating}
                lastResult={lastResult}
                lastSimulation={lastSimulation}
                parseLogs={parseLogs}
                parseSimulationLogs={parseSimulationLogs}
                lastAction={lastAction}
            />
            {hasPendingAction && (
                <MainnetWarningDialog
                    open={isOpen}
                    onOpenChange={open => {
                        if (!open) {
                            cancel();
                        }
                    }}
                    onConfirm={confirm}
                    onCancel={cancel}
                />
            )}
        </>
    );
}
