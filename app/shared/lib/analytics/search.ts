import { type GA4EventName, trackEvent } from './track-event';

export enum SearchEvent {
    Performed = 'srch_performed',
    ResultSelected = 'srch_result_selected',
}

type _SearchEventNames = `${SearchEvent}`;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- forces a compile error if any enum value exceeds the limit
const _assertGA4Length: _SearchEventNames extends GA4EventName<_SearchEventNames> ? true : never = true;

export const searchAnalytics = {
    trackPerformed(queryLength: number, resultsCount: number): void {
        trackEvent(SearchEvent.Performed, { query_length: queryLength, results_count: resultsCount });
    },

    trackResultSelected(resultType: string, resultVerified: boolean): void {
        trackEvent(SearchEvent.ResultSelected, { result_type: resultType, result_verified: resultVerified });
    },
};
