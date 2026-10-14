import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it } from 'vitest';

import { useEdgeFades } from '../use-edge-fades';

function makeScroll(overrides: Partial<HTMLDivElement> = {}) {
    return {
        current: {
            clientHeight: 100,
            clientWidth: 100,
            scrollHeight: 100,
            scrollLeft: 0,
            scrollTop: 0,
            scrollWidth: 100,
            ...overrides,
        },
    } as React.RefObject<HTMLDivElement | null>;
}

describe('useEdgeFades', () => {
    it('should expose a mask gradient, a content ref and a scroll handler', () => {
        const { result } = renderHook(() => useEdgeFades(makeScroll(), true));

        expect(result.current.maskImage).toContain('linear-gradient');
        expect(typeof result.current.contentRef).toBe('function');
        expect(typeof result.current.onScroll).toBe('function');
    });

    it('should tolerate a null scroll node', () => {
        const { result } = renderHook(() => useEdgeFades({ current: null }, true));
        expect(() => act(() => result.current.onScroll())).not.toThrow();
    });

    it('should keep both edges opaque when there is nothing to scroll', () => {
        const { result } = renderHook(() => useEdgeFades(makeScroll(), true));

        act(() => result.current.onScroll());

        // No overflow → no fade → the gradient stays fully opaque at both ends.
        expect(result.current.maskImage).toContain('rgba(0,0,0,1)');
    });

    it('should attach and detach a content node without throwing', () => {
        const { result } = renderHook(() => useEdgeFades(makeScroll(), true));

        const node = document.createElement('div');
        expect(() => act(() => result.current.contentRef(node))).not.toThrow();
        expect(() => act(() => result.current.contentRef(null))).not.toThrow();
    });

    it('should default to a vertical (to bottom) mask', () => {
        const { result } = renderHook(() => useEdgeFades(makeScroll(), true));
        expect(result.current.maskImage).toContain('to bottom');
    });

    it('should produce a horizontal (to right) mask on the horizontal axis', () => {
        const { result } = renderHook(() => useEdgeFades(makeScroll(), true, 'horizontal'));
        expect(result.current.maskImage).toContain('to right');
    });

    it('should fade the far horizontal edge when content overflows to the right', () => {
        const { result } = renderHook(() =>
            useEdgeFades(makeScroll({ clientWidth: 100, scrollLeft: 0, scrollWidth: 400 }), true, 'horizontal'),
        );

        act(() => result.current.onScroll());

        // Start edge (left) is at 0 → opaque; end edge (right) has 300px hidden → fully faded.
        expect(result.current.maskImage).toContain('rgba(0,0,0,1) 0');
        expect(result.current.maskImage).toContain('rgba(0,0,0,0) 100%');
    });
});
