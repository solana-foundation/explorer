import { type GA4EventName, trackEvent } from './track-event';

export enum RefreshEvent {
    ButtonClicked = 'rfsh_button_clicked',
}

// Build fails if any enum value exceeds GA4's 40-char limit
type _RefreshEventNames = `${RefreshEvent}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any enum value exceeds the limit
const _assertGA4Length: _RefreshEventNames extends GA4EventName<_RefreshEventNames> ? true : never = true;

export const refreshAnalytics = {
    trackButtonClicked(section: string): void {
        trackEvent(RefreshEvent.ButtonClicked, { section });
    },
};
