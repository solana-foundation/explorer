import { type GA4EventName, trackEvent } from './track-event';

export enum ReceiptEvent {
    ButtonClicked = 'rcpt_button_clicked',
    Download = 'rcpt_download',
    NoReceipt = 'rcpt_no_receipt',
    NoReceiptAutoRedirect = 'rcpt_no_receipt_auto_redirect',
    ShareCopyLink = 'rcpt_share_copy_link',
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

    trackDownload(signature: string): void {
        trackEvent(ReceiptEvent.Download, { signature });
    },

    trackNoReceipt(signature: string): void {
        trackEvent(ReceiptEvent.NoReceipt, { signature });
    },

    trackNoReceiptAutoRedirect(signature: string): void {
        trackEvent(ReceiptEvent.NoReceiptAutoRedirect, { signature });
    },

    trackShareCopyLink(signature: string): void {
        trackEvent(ReceiptEvent.ShareCopyLink, { signature });
    },

    trackShareNative(signature: string): void {
        trackEvent(ReceiptEvent.ShareNative, { signature });
    },

    trackShareOnX(signature: string): void {
        trackEvent(ReceiptEvent.ShareOnX, { signature });
    },

    trackViewTxClicked(signature: string): void {
        trackEvent(ReceiptEvent.ViewTxClicked, { signature });
    },

    trackViewed(signature: string, receiptType: 'sol' | 'token'): void {
        trackEvent(ReceiptEvent.Viewed, { receipt_type: receiptType, signature });
    },
};
