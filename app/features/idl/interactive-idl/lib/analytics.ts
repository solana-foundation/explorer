import type { IdlSource, IdlStandard } from '@entities/idl';

import { type EventParams, type GA4EventName, trackEvent } from '@/app/shared/lib/analytics';

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
export function createIdlAnalytics(standard: IdlStandard, source: IdlSource): IdlAnalytics {
    const idlType = IDL_TYPE_LABELS[standard];
    const track = (action: IidlAction, params: EventParams) =>
        trackEvent(eventName(idlType, action), { ...params, idl_source: source });
    // A custom IDL stays in the browser, so `fromIdl` must wrap each param that holds text from the IDL.
    const fromIdl = (params: EventParams): EventParams => (source === 'custom' ? {} : params);
    return {
        trackIdlViewed(programId) {
            track(IIDL_ACTIONS.IdlViewed, { program_id: programId });
        },
        trackSectionsExpanded(programId, expandedSections) {
            track(IIDL_ACTIONS.SectionsExpanded, {
                ...fromIdl({ expanded_sections: expandedSections?.join(',') }),
                expanded_sections_count: expandedSections?.length,
                program_id: programId,
            });
        },
        trackTabOpened(programId) {
            track(IIDL_ACTIONS.TabOpened, { program_id: programId });
        },
        trackTransactionConfirmed(programId, instructionName, signature) {
            track(IIDL_ACTIONS.TransactionConfirmed, {
                ...fromIdl({ instruction_name: instructionName }),
                program_id: programId,
                transaction_signature: signature,
            });
        },
        trackTransactionFailed(programId, instructionName, error) {
            track(IIDL_ACTIONS.TransactionFailed, {
                ...fromIdl({ error_message: error, instruction_name: instructionName }),
                program_id: programId,
            });
        },
        trackTransactionSimulated(programId, instructionName) {
            track(IIDL_ACTIONS.TransactionSimulated, {
                ...fromIdl({ instruction_name: instructionName }),
                program_id: programId,
            });
        },
        trackTransactionSubmitted(programId, instructionName) {
            track(IIDL_ACTIONS.TransactionSubmitted, {
                ...fromIdl({ instruction_name: instructionName }),
                program_id: programId,
            });
        },
        trackWalletConnected(programId, walletType) {
            track(IIDL_ACTIONS.WalletConnected, { program_id: programId, wallet_type: walletType });
        },
    };
}
