// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBreakpoint } from '../use-breakpoint';

// Breakpoint pixel values from tailwind.config.ts
const BP = { lg: 992, md: 768, sm: 576, xl: 1200, xs: 375, xxl: 1400 } as const;

const NO_MATCH = { isLandscape: false, isLg: false, isMd: false, isSm: false, isXl: false, isXs: false, isXxl: false };

function mockMatchMedia(width: number, isLandscape = false) {
    vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => {
        let matches: boolean;
        if (query.includes('orientation: landscape')) {
            matches = isLandscape;
        } else {
            // eslint-disable-next-line no-restricted-syntax -- need regex to parse CSS media query string from matchMedia
            const m = query.match(/\(min-width:\s*(\d+)px\)/);
            const minWidth = m ? parseInt(m[1], 10) : 0;
            matches = width >= minWidth;
        }
        return {
            addEventListener: vi.fn(),
            addListener: vi.fn(),
            dispatchEvent: vi.fn(),
            matches,
            media: query,
            onchange: null,
            removeEventListener: vi.fn(),
            removeListener: vi.fn(),
        } as unknown as MediaQueryList;
    });
}

describe('useBreakpoint', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        { expected: NO_MATCH, width: BP.xs - 1 },
        { expected: { ...NO_MATCH, isXs: true }, width: BP.xs },
        { expected: { ...NO_MATCH, isSm: true, isXs: true }, width: BP.sm },
        { expected: { ...NO_MATCH, isMd: true, isSm: true, isXs: true }, width: BP.md },
        { expected: { ...NO_MATCH, isLg: true, isMd: true, isSm: true, isXs: true }, width: BP.lg },
        { expected: { ...NO_MATCH, isLg: true, isMd: true, isSm: true, isXl: true, isXs: true }, width: BP.xl },
        {
            expected: { ...NO_MATCH, isLg: true, isMd: true, isSm: true, isXl: true, isXs: true, isXxl: true },
            width: BP.xxl,
        },
    ])('should report the breakpoints for a $width px viewport', ({ expected, width }) => {
        mockMatchMedia(width);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current).toEqual(expected);
    });

    it('should update state when a media query fires a change event', () => {
        const changeHandlers: ((e: MediaQueryListEvent) => void)[] = [];

        vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => {
            return {
                addEventListener: vi.fn((_type: string, handler: EventListenerOrEventListenerObject) => {
                    changeHandlers.push(handler as (e: MediaQueryListEvent) => void);
                }),
                addListener: vi.fn(),
                dispatchEvent: vi.fn(),
                matches: false,
                media: query,
                onchange: null,
                removeEventListener: vi.fn(),
                removeListener: vi.fn(),
            } as unknown as MediaQueryList;
        });

        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isXs).toBe(false);

        // isXs is the first useMediaQuery call in the hook
        act(() => {
            changeHandlers[0]({ matches: true } as MediaQueryListEvent);
        });

        expect(result.current.isXs).toBe(true);
    });

    it('should remove all event listeners on unmount', () => {
        const removeEventListener = vi.fn();
        vi.spyOn(globalThis, 'matchMedia').mockReturnValue({
            addEventListener: vi.fn(),
            addListener: vi.fn(),
            dispatchEvent: vi.fn(),
            matches: false,
            media: '',
            onchange: null,
            removeEventListener,
            removeListener: vi.fn(),
        } as unknown as MediaQueryList);

        const { unmount } = renderHook(() => useBreakpoint());
        unmount();

        // 7 queries (xs, sm, md, lg, xl, 2xl, landscape) × 1 removeEventListener each
        expect(removeEventListener).toHaveBeenCalledTimes(7);
    });
});
