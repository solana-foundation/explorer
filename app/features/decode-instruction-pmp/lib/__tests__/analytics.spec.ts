import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { pmpAnalytics } from '../analytics';

vi.mock('@/app/shared/lib/analytics', () => ({ trackEvent: vi.fn() }));

describe('pmpAnalytics', () => {
    beforeEach(() => {
        vi.mocked(trackEvent).mockClear();
    });

    it('should emit pmp_data_tab_opened when the decoded tab is opened', () => {
        pmpAnalytics.trackTabOpened({
            dataSource: 'direct',
            format: 'json',
            instruction: 'set_data',
            source: 'instruction',
            tab: 'decoded',
        });

        expect(trackEvent).toHaveBeenCalledWith('pmp_data_tab_opened', {
            data_source: 'direct',
            format: 'json',
            instruction: 'set_data',
            source: 'instruction',
            tab: 'decoded',
        });
    });

    it('should emit pmp_data_tab_opened for a non-Direct data source', () => {
        pmpAnalytics.trackTabOpened({
            dataSource: 'url',
            format: 'json',
            instruction: 'initialize',
            source: 'instruction',
            tab: 'raw',
        });

        expect(trackEvent).toHaveBeenCalledWith('pmp_data_tab_opened', {
            data_source: 'url',
            format: 'json',
            instruction: 'initialize',
            source: 'instruction',
            tab: 'raw',
        });
    });

    it('should carry the account source when the tabs render fetched account content', () => {
        pmpAnalytics.trackTabOpened({
            dataSource: 'direct',
            format: 'json',
            instruction: 'set_data',
            source: 'account',
            tab: 'raw',
        });

        expect(trackEvent).toHaveBeenCalledWith('pmp_data_tab_opened', expect.objectContaining({ source: 'account' }));
    });

    it('should expose no decode-outcome event', () => {
        // Pins the deliberate removal: whether a payload decodes is a property of the instruction's bytes, not of
        // anything the reader did, so it is not tracked. Guards against the old event being reinstated by habit.
        expect('trackDecodeCompleted' in pmpAnalytics).toBe(false);
    });
});
