import { type GA4EventName, trackEvent } from '@/app/shared/lib/analytics';

/** Which panel of the Decoded Content section the reader switched to. */
export type PmpTab = 'decoded' | 'raw';

/** Where the bytes in the section came from: the instruction itself, or the account it points at. */
export type PmpPayloadSource = 'account' | 'instruction';

const PMP_TAB_OPENED = 'pmp_data_tab_opened';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- compile error if the name exceeds GA4's 40-char cap
const _assertGA4Length: typeof PMP_TAB_OPENED extends GA4EventName<typeof PMP_TAB_OPENED> ? true : never = true;

export const pmpAnalytics = {
    /**
     * Fires on a reader-initiated tab switch only. Radix's `onValueChange` does not fire for the tab that is
     * selected on mount, so the default panel never produces an event and the counts stay comparable.
     *
     * `dataSource` is carried because the tabs now render for `Url` and `External` too, where the decoded panel
     * shows the on-chain pointer rather than a document - without it those clicks are indistinguishable.
     * `source` separates the two panels that share these tabs, which open on different default tabs.
     */
    trackTabOpened({
        dataSource,
        format,
        instruction,
        source,
        tab,
    }: {
        dataSource: string;
        format: string;
        instruction: string;
        source: PmpPayloadSource;
        tab: PmpTab;
    }): void {
        trackEvent(PMP_TAB_OPENED, { data_source: dataSource, format, instruction, source, tab });
    },
};
