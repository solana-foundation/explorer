import { type GA4EventName, trackEvent } from './track-event';

export enum CustomIdlEvent {
    Added = 'cidl_added',
    Removed = 'cidl_removed',
    Replaced = 'cidl_replaced',
    Selected = 'cidl_selected',
    UploadFailed = 'cidl_upload_failed',
}

// Build fails if any enum value exceeds GA4's 40-char limit
type _CustomIdlEventNames = `${CustomIdlEvent}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any enum value exceeds the limit
const _assertGA4Length: _CustomIdlEventNames extends GA4EventName<_CustomIdlEventNames> ? true : never = true;

type Standard = 'Anchor' | 'Codama';

type Origin = 'file' | 'pasted';

type UploadFailureReason =
    | 'not-json'
    | 'not-an-idl'
    | 'missing-address'
    | 'invalid-address'
    | 'program-mismatch'
    | 'cannot-load'
    | 'check-failed'
    | 'quota-exceeded'
    | 'unavailable';

// A custom IDL never leaves the browser, so these events carry no text from the IDL other than its program address.
export const customIdlAnalytics = {
    trackAdded(programId: string, standard: Standard, origin: Origin): void {
        trackEvent(CustomIdlEvent.Added, { origin, program_id: programId, standard: standard.toLowerCase() });
    },

    trackRemoved(programId: string | undefined): void {
        trackEvent(CustomIdlEvent.Removed, { program_id: programId });
    },

    trackReplaced(programId: string, standard: Standard, origin: Origin): void {
        trackEvent(CustomIdlEvent.Replaced, { origin, program_id: programId, standard: standard.toLowerCase() });
    },

    trackSelected(programId: string, selection: 'custom' | 'onChain'): void {
        trackEvent(CustomIdlEvent.Selected, { program_id: programId, selection });
    },

    trackUploadFailed(reason: UploadFailureReason): void {
        trackEvent(CustomIdlEvent.UploadFailed, { reason });
    },
};
