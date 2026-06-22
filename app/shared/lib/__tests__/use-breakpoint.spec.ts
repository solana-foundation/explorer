import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBreakpoint } from '../use-breakpoint';

// Breakpoint pixel values from tailwind.config.ts
const BP = { lg: 992, md: 768, sm: 576, xl: 1200, xs: 375, xxl: 1400 } as const;

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

    it('should return all false below xs (374px)', () => {
        mockMatchMedia(BP.xs - 1);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current).toEqual({
            isLandscape: false,
            isLg: false,
            isMd: false,
            isSm: false,
            isXl: false,
            isXs: false,
            isXxl: false,
        });
    });

    it('should return isXs true at xs (375px), sm and above false', () => {
        mockMatchMedia(BP.xs);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isXs).toBe(true);
        expect(result.current.isSm).toBe(false);
        expect(result.current.isMd).toBe(false);
        expect(result.current.isLg).toBe(false);
        expect(result.current.isXl).toBe(false);
        expect(result.current.isXxl).toBe(false);
    });

    it('should return isSm true at sm (576px), isMd and above false', () => {
        mockMatchMedia(BP.sm);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isXs).toBe(true);
        expect(result.current.isSm).toBe(true);
        expect(result.current.isMd).toBe(false);
        expect(result.current.isLg).toBe(false);
    });

    it('should return isMd true at md (768px), isLg and above false', () => {
        mockMatchMedia(BP.md);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isMd).toBe(true);
        expect(result.current.isLg).toBe(false);
    });

    it('should return isLg true at lg (992px), isXl and above false', () => {
        mockMatchMedia(BP.lg);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isLg).toBe(true);
        expect(result.current.isXl).toBe(false);
    });

    it('should return isXl true at xl (1200px), isXxl false', () => {
        mockMatchMedia(BP.xl);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current.isXl).toBe(true);
        expect(result.current.isXxl).toBe(false);
    });

    it('should return all true at 2xl (1400px)', () => {
        mockMatchMedia(BP.xxl);
        const { result } = renderHook(() => useBreakpoint());
        expect(result.current).toEqual({
            isLandscape: false,
            isLg: true,
            isMd: true,
            isSm: true,
            isXl: true,
            isXs: true,
            isXxl: true,
        });
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
