import { trackEvent } from './track-event';

const IDL_ANALYTICS_PREFIX = 'feature_interactive_idl_anchor';

function trackIdlEvent(
    eventName: string,
    params?: { [key: string]: string | number | boolean | undefined },
    prefix = IDL_ANALYTICS_PREFIX
): void {
    trackEvent(`${prefix}_${eventName}`, params);
}

export const idlAnalytics = {
    trackSectionsExpanded(programId?: string, expandedSections?: string[]): void {
        trackIdlEvent('sections_expanded', {
            expanded_sections: expandedSections?.join(','),
            expanded_sections_count: expandedSections?.length,
            program_id: programId,
        });
    },

    trackTabOpened(programId?: string): void {
        trackIdlEvent('tab_opened', {
            program_id: programId,
        });
    },

    trackTransactionConfirmed(programId?: string, instructionName?: string, signature?: string): void {
        trackIdlEvent('transaction_confirmed', {
            instruction_name: instructionName,
            program_id: programId,
            transaction_signature: signature,
        });
    },

    trackTransactionFailed(programId?: string, instructionName?: string, error?: string): void {
        trackIdlEvent('transaction_failed', {
            error_message: error,
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackTransactionSubmitted(programId?: string, instructionName?: string): void {
        trackIdlEvent('transaction_submitted', {
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackWalletConnected(programId?: string, walletType?: string): void {
        trackIdlEvent('wallet_connected', {
            program_id: programId,
            wallet_type: walletType,
        });
    },
};
