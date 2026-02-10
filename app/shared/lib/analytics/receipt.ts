import { type GA4EventName, trackEvent } from './track-event';

export enum ReceiptEvent {
    ButtonClicked = 'rcpt_button_clicked',
    NoReceipt = 'rcpt_no_receipt',
    ViewTxClicked = 'rcpt_view_tx_clicked',
    Viewed = 'rcpt_viewed',
}

// Build fails if any enum value exceeds GA4's 40-char limit
type _ReceiptEventNames = `${ReceiptEvent}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any enum value exceeds the limit
const _assertGA4Length: _ReceiptEventNames extends GA4EventName<_ReceiptEventNames> ? true : never = true;

export const receiptAnalytics = {
    trackButtonClicked(signature: string): void {
        trackEvent(ReceiptEvent.ButtonClicked, { signature });
    },

    trackNoReceipt(signature: string): void {
        trackEvent(ReceiptEvent.NoReceipt, { signature });
    },

    trackViewTxClicked(signature: string): void {
        trackEvent(ReceiptEvent.ViewTxClicked, { signature });
    },

    trackViewed(signature: string, receiptType: 'sol' | 'token'): void {
        trackEvent(ReceiptEvent.Viewed, { receipt_type: receiptType, signature });
    },
};
