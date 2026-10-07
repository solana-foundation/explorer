// @vitest-environment jsdom

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

    it.each([
        { apis: [], coarse: true, expected: false, hoverNone: true, scenario: 'navigator.share is missing' },
        { apis: ['share'], coarse: true, expected: false, hoverNone: true, scenario: 'navigator.canShare is missing' },
        { apis: ['share', 'canShare'], coarse: false, expected: false, hoverNone: true, scenario: 'no coarse pointer' },
        { apis: ['share', 'canShare'], coarse: true, expected: false, hoverNone: false, scenario: 'hover is present' },
        { apis: ['share', 'canShare'], coarse: true, expected: true, hoverNone: true, scenario: 'a mobile device' },
    ])('should return $expected when $scenario', ({ apis, coarse, expected, hoverNone }) => {
        mockMatchMedia(coarse, hoverNone);
        for (const api of apis) {
            Object.defineProperty(navigator, api, { configurable: true, value: vi.fn() });
        }
        const { result } = renderHook(() => useCanNativeShare());
        expect(result.current).toBe(expected);
    });
});
