type EventParams = {
    [key: string]: string | number | boolean | undefined;
};

export function trackEvent(eventName: string, params?: EventParams): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...params,
            });
            return;
        }

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
            return;
        }
    } catch (error) {
        console.error(error);
    }
}

export const idlAnalytics = {
    trackInstructionExecutionError(instructionName: string, programId?: string, error?: string): void {
        trackEvent('idl_instruction_execution_error', {
            error_message: error,
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackInstructionExecutionStarted(instructionName: string, programId?: string): void {
        trackEvent('idl_instruction_execution_started', {
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackInstructionExecutionSuccess(instructionName: string, programId?: string, signature?: string): void {
        trackEvent('idl_instruction_execution_success', {
            instruction_name: instructionName,
            program_id: programId,
            transaction_signature: signature,
        });
    },

    trackInstructionExpanded(instructionName: string, programId?: string): void {
        trackEvent('idl_instruction_expanded', {
            instruction_name: instructionName,
            program_id: programId,
        });
    },
};

declare global {
    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
        gtag?: (...args: unknown[]) => void;
    }
}
