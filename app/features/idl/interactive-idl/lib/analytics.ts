import type { IdlStandard } from '@entities/idl';

import { type GA4EventName, trackEvent } from '@/app/shared/lib/analytics';

type IdlTypeLabel = 'anchor' | 'codama';

const IDL_TYPE_LABELS: Record<IdlStandard, IdlTypeLabel> = {
    Anchor: 'anchor',
    Codama: 'codama',
};

// Interactive IDL actions are the same for IdlStandards.
// This generates both the `iidl_anchor_*` and `iidl_codama_*` variants.
const IIDL_ACTIONS = {
    IdlViewed: 'idl_viewed',
    SectionsExpanded: 'sections_expanded',
    TabOpened: 'tab_opened',
    TransactionConfirmed: 'transaction_confirmed',
    TransactionFailed: 'transaction_failed',
    TransactionSimulated: 'transaction_simulated',
    TransactionSubmitted: 'transaction_submitted',
    WalletConnected: 'wallet_connected',
} as const;

type IidlAction = (typeof IIDL_ACTIONS)[keyof typeof IIDL_ACTIONS];
type IidlEventName = `iidl_${IdlTypeLabel}_${IidlAction}`;

// Single compile-time guard for ALL generated names (2 standards × 8 actions).
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any generated name exceeds GA4's 40-char limit
const _assertGA4Length: IidlEventName extends GA4EventName<IidlEventName> ? true : never = true;

const eventName = (idlType: IdlTypeLabel, action: IidlAction): IidlEventName => `iidl_${idlType}_${action}`;

export type IdlAnalytics = {
    trackIdlViewed(programId?: string): void;
    trackSectionsExpanded(programId?: string, expandedSections?: string[]): void;
    trackTabOpened(programId?: string): void;
    trackTransactionConfirmed(programId?: string, instructionName?: string, signature?: string): void;
    trackTransactionFailed(programId?: string, instructionName?: string, error?: string): void;
    trackTransactionSimulated(programId?: string, instructionName?: string): void;
    trackTransactionSubmitted(programId?: string, instructionName?: string): void;
    trackWalletConnected(programId?: string, walletType?: string): void;
};

/**
 * Builds an Interactive IDL analytics tracker.
 * GA event names are scoped to the IDL standard:
 * - 'Anchor' -> iidl_anchor_*
 * - 'Codama' -> iidl_codama_*
 */
export function createIdlAnalytics(standard: IdlStandard): IdlAnalytics {
    const idlType = IDL_TYPE_LABELS[standard];
    return {
        trackIdlViewed(programId) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.IdlViewed), {
                program_id: programId,
            });
        },
        trackSectionsExpanded(programId, expandedSections) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.SectionsExpanded), {
                expanded_sections: expandedSections?.join(','),
                expanded_sections_count: expandedSections?.length,
                program_id: programId,
            });
        },
        trackTabOpened(programId) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.TabOpened), {
                program_id: programId,
            });
        },
        trackTransactionConfirmed(programId, instructionName, signature) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.TransactionConfirmed), {
                instruction_name: instructionName,
                program_id: programId,
                transaction_signature: signature,
            });
        },
        trackTransactionFailed(programId, instructionName, error) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.TransactionFailed), {
                error_message: error,
                instruction_name: instructionName,
                program_id: programId,
            });
        },
        trackTransactionSimulated(programId?: string, instructionName?: string): void {
            trackEvent(eventName(idlType, IIDL_ACTIONS.TransactionSimulated), {
                instruction_name: instructionName,
                program_id: programId,
            });
        },
        trackTransactionSubmitted(programId, instructionName) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.TransactionSubmitted), {
                instruction_name: instructionName,
                program_id: programId,
            });
        },
        trackWalletConnected(programId, walletType) {
            trackEvent(eventName(idlType, IIDL_ACTIONS.WalletConnected), {
                program_id: programId,
                wallet_type: walletType,
            });
        },
    };
}
