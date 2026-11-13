import { describe, expect, it } from 'vitest';

import { previewUpcomingFeatures, UPCOMING_FULL_LIST_LIMIT, UPCOMING_PREVIEW_SIZE } from '../preview-upcoming-features';

const list = (length: number) => Array.from({ length }, (_, index) => index);

describe('previewUpcomingFeatures', () => {
    it('should show a short list in full', () => {
        expect(previewUpcomingFeatures(list(UPCOMING_FULL_LIST_LIMIT), false)).toEqual({
            hiddenCount: 0,
            visible: list(UPCOMING_FULL_LIST_LIMIT),
        });
    });

    it('should fold a longer list to its first rows', () => {
        const length = UPCOMING_FULL_LIST_LIMIT + 1;
        expect(previewUpcomingFeatures(list(length), false)).toEqual({
            hiddenCount: length - UPCOMING_PREVIEW_SIZE,
            visible: list(UPCOMING_PREVIEW_SIZE),
        });
    });

    it('should show a longer list in full once asked', () => {
        expect(previewUpcomingFeatures(list(12), true)).toEqual({ hiddenCount: 0, visible: list(12) });
    });
});
