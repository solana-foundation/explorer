import { type GA4EventName, trackEvent } from './track-event';

export enum AnchorInteractiveIdlEvent {
    SectionsExpanded = 'iidl_anchor_sections_expanded',
    TabOpened = 'iidl_anchor_tab_opened',
    TransactionConfirmed = 'iidl_anchor_transaction_confirmed',
    TransactionFailed = 'iidl_anchor_transaction_failed',
    TransactionSubmitted = 'iidl_anchor_transaction_submitted',
    WalletConnected = 'iidl_anchor_wallet_connected',
}

// Build fails if any enum value exceeds GA4's 40-char limit
type _AnchorInteractiveIdlEventNames = `${AnchorInteractiveIdlEvent}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any enum value exceeds the limit
const _assertGA4Length: _AnchorInteractiveIdlEventNames extends GA4EventName<_AnchorInteractiveIdlEventNames>
    ? true
    : never = true;

export const idlAnalytics = {
    trackSectionsExpanded(programId?: string, expandedSections?: string[]): void {
        trackEvent(AnchorInteractiveIdlEvent.SectionsExpanded, {
            expanded_sections: expandedSections?.join(','),
            expanded_sections_count: expandedSections?.length,
            program_id: programId,
        });
    },

    trackTabOpened(programId?: string): void {
        trackEvent(AnchorInteractiveIdlEvent.TabOpened, {
            program_id: programId,
        });
    },

    trackTransactionConfirmed(programId?: string, instructionName?: string, signature?: string): void {
        trackEvent(AnchorInteractiveIdlEvent.TransactionConfirmed, {
            instruction_name: instructionName,
            program_id: programId,
            transaction_signature: signature,
        });
    },

    trackTransactionFailed(programId?: string, instructionName?: string, error?: string): void {
        trackEvent(AnchorInteractiveIdlEvent.TransactionFailed, {
            error_message: error,
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackTransactionSubmitted(programId?: string, instructionName?: string): void {
        trackEvent(AnchorInteractiveIdlEvent.TransactionSubmitted, {
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackWalletConnected(programId?: string, walletType?: string): void {
        trackEvent(AnchorInteractiveIdlEvent.WalletConnected, {
            program_id: programId,
            wallet_type: walletType,
        });
    },
};
