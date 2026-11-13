import { describe, expect, it } from 'vitest';

import { getVisibleTabsCount } from '../use-tab-overflow';

// Tab right-edges laid out left-to-right from the container's left edge, each `width` wide and touching;
// a column gap, when present, is passed separately as the `gap` argument to `getVisibleTabsCount`.
function tabRects(widths: number[], { left = 0 } = {}) {
    let right = left;
    return widths.map(width => {
        right += width;
        return { right };
    });
}

describe('getVisibleTabsCount', () => {
    it('should keep every tab when the container has not been measured yet', () => {
        expect(
            getVisibleTabsCount({
                containerRect: { left: 0, width: 0 },
                gap: 0,
                moreWidth: 50,
                tabRects: tabRects([80, 80]),
            }),
        ).toBe(2);
    });

    it('should keep every tab when the last one fits', () => {
        expect(
            getVisibleTabsCount({
                containerRect: { left: 0, width: 300 },
                gap: 0,
                moreWidth: 50,
                tabRects: tabRects([100, 100, 100]),
            }),
        ).toBe(3);
    });

    it('should keep the last tab when it overshoots only by sub-pixel rounding', () => {
        expect(
            getVisibleTabsCount({
                containerRect: { left: 0, width: 300 },
                gap: 0,
                moreWidth: 50,
                tabRects: tabRects([100, 100, 100.4]),
            }),
        ).toBe(3);
    });

    it('should reserve room for the More trigger once a tab overflows', () => {
        // Three 100px tabs do not fit in 250px, so More (50px) must appear. Two tabs plus More fill exactly
        // 250px, so the third is hidden and the count is 2.
        expect(
            getVisibleTabsCount({
                containerRect: { left: 0, width: 250 },
                gap: 0,
                moreWidth: 50,
                tabRects: tabRects([100, 100, 100]),
            }),
        ).toBe(2);
    });

    it('should count the column gap into the reserved More width', () => {
        expect(
            getVisibleTabsCount({
                containerRect: { left: 0, width: 250 },
                gap: 20,
                moreWidth: 50,
                tabRects: tabRects([100, 100, 100]),
            }),
        ).toBe(1);
    });

    it('should offset rects by the container left edge', () => {
        expect(
            getVisibleTabsCount({
                containerRect: { left: 1000, width: 300 },
                gap: 0,
                moreWidth: 50,
                tabRects: tabRects([100, 100, 100], { left: 1000 }),
            }),
        ).toBe(3);
    });
});
