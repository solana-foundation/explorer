import { isEnvEnabled } from '@utils/env';

type EventParams = {
    [key: string]: string | number | boolean | undefined;
};

type DataLayer = Array<Record<string, unknown>>;

function hasDataLayer(win: Window): win is Window & { dataLayer: DataLayer } {
    return 'dataLayer' in win && Array.isArray(win.dataLayer);
}

function hasGtag(win: Window): win is Window & { gtag: (...args: unknown[]) => void } {
    return typeof (win as unknown as { gtag?: unknown }).gtag === 'function';
}

function isAnalyticsEnabled(): boolean {
    return (
        isEnvEnabled(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID) ||
        isEnvEnabled(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID)
    );
}

export function trackEvent(eventName: string, params?: EventParams): void {
    if (typeof window === 'undefined') {
        return;
    }

        console.log(eventName, params)

    if (!isAnalyticsEnabled()) {
        return;
    }

    try {
        if (hasDataLayer(window)) {
            window.dataLayer.push({
                event: eventName,
                ...params,
            });
            return;
        }

        if (hasGtag(window)) {
            window.gtag('event', eventName, params);
            return;
        }
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

export const idlAnalytics = {
    trackSectionsExpanded(expandedSections: string[], programId?: string): void {
        trackEvent('feature_interactive_idl_anchor_sections_expanded', {
            expanded_sections: expandedSections.join(','),
            expanded_sections_count: expandedSections.length,
            program_id: programId,
        });
    },

    trackTabOpened(programId?: string): void {
        trackEvent('feature_interactive_idl_anchor_tab_opened', {
            program_id: programId,
        });
    },

    trackTransactionConfirmed(instructionName: string, programId?: string, signature?: string): void {
        trackEvent('feature_interactive_idl_anchor_transaction_confirmed', {
            instruction_name: instructionName,
            program_id: programId,
            transaction_signature: signature,
        });
    },

    trackTransactionFailed(instructionName: string, programId?: string, error?: string): void {
        trackEvent('feature_interactive_idl_anchor_transaction_failed', {
            error_message: error,
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackTransactionSubmitted(instructionName: string, programId?: string): void {
        trackEvent('feature_interactive_idl_anchor_transaction_submitted', {
            instruction_name: instructionName,
            program_id: programId,
        });
    },

    trackWalletConnected(programId?: string, walletType?: string): void {
        trackEvent('feature_interactive_idl_anchor_wallet_connected', {
            program_id: programId,
            wallet_type: walletType,
        });
    },
};
