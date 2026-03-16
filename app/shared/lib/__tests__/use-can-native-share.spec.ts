import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCanNativeShare } from '../use-can-native-share';

function mockMatchMedia(pointerCoarse: boolean, hoverNone: boolean) {
    vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => {
        const matches = (query === '(pointer: coarse)' && pointerCoarse) || (query === '(hover: none)' && hoverNone);
        return { matches } as MediaQueryList;
    });
}

describe('useCanNativeShare', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined, writable: true });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined, writable: true });
    });

    it('returns false when navigator.share is not available', () => {
        mockMatchMedia(true, true);
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(false);
    });

    it('returns false when navigator.canShare is not available', () => {
        mockMatchMedia(true, true);
        Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(false);
    });

    it('returns false when device is not mobile (no coarse pointer)', () => {
        mockMatchMedia(false, true);
        Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn() });
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(false);
    });

    it('returns false when device is not mobile (has hover support)', () => {
        mockMatchMedia(true, false);
        Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn() });
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(false);
    });

    it('returns true when share APIs are available and device is mobile', () => {
        mockMatchMedia(true, true);
        Object.defineProperty(navigator, 'share', { configurable: true, value: vi.fn() });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn() });
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(true);
    });
});
