import { act, render, renderHook, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useVisibility, VisibilityProvider } from '../visibility';

let observeCallbacks: Map<Element, IntersectionObserverCallback>;
let mockObserve: ReturnType<typeof vi.fn>;
let mockUnobserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
    observeCallbacks = new Map();
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    vi.stubGlobal(
        'IntersectionObserver',
        vi.fn((callback: IntersectionObserverCallback) => {
            const instance = {
                disconnect: mockDisconnect,
                observe: mockObserve.mockImplementation((el: Element) => {
                    observeCallbacks.set(el, callback);
                }),
                unobserve: mockUnobserve,
            };
            return instance;
        }),
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => <VisibilityProvider>{children}</VisibilityProvider>;

describe('VisibilityProvider + useVisibility', () => {
    it('should return isVisible=false initially', () => {
        const { result } = renderHook(() => useVisibility<HTMLDivElement>(true), { wrapper });
        expect(result.current.isVisible).toBe(false);
    });

    it('should not observe when disabled', () => {
        renderHook(() => useVisibility(false), { wrapper });
        expect(mockObserve).not.toHaveBeenCalled();
    });

    it('should observe the ref element when enabled', () => {
        function TestComponent() {
            const { ref } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} data-testid="target" />;
        }

        render(<TestComponent />, { wrapper });
        expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('should set isVisible=true when element intersects', () => {
        function TestComponent() {
            const { ref, isVisible } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} data-testid={isVisible ? 'visible' : 'hidden'} />;
        }

        render(<TestComponent />, { wrapper });
        const el = screen.getByTestId('hidden');

        act(() => simulateIntersection(el, true));

        expect(screen.getByTestId('visible')).toBeDefined();
    });

    it('should unobserve the element after it becomes visible', () => {
        function TestComponent() {
            const { ref } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} data-testid="target" />;
        }

        render(<TestComponent />, { wrapper });
        const el = screen.getByTestId('target');

        act(() => simulateIntersection(el, true));

        expect(mockUnobserve).toHaveBeenCalledWith(el);
    });

    it('should not set isVisible for non-intersecting entries', () => {
        function TestComponent() {
            const { ref, isVisible } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} data-testid={isVisible ? 'visible' : 'hidden'} />;
        }

        render(<TestComponent />, { wrapper });
        const el = screen.getByTestId('hidden');

        act(() => simulateIntersection(el, false));

        expect(screen.getByTestId('hidden')).toBeDefined();
    });

    it('should create only one IntersectionObserver for multiple elements', () => {
        function TestComponent() {
            const a = useVisibility<HTMLDivElement>(true);
            const b = useVisibility<HTMLDivElement>(true);
            return (
                <>
                    <div ref={a.ref} />
                    <div ref={b.ref} />
                </>
            );
        }

        render(<TestComponent />, { wrapper });
        expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    });

    it('should unobserve on cleanup when component unmounts', () => {
        function TestComponent() {
            const { ref } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} data-testid="target" />;
        }

        const { unmount } = render(<TestComponent />, { wrapper });
        const el = screen.getByTestId('target');

        unmount();

        expect(mockUnobserve).toHaveBeenCalledWith(el);
    });

    it('should not observe without VisibilityProvider', () => {
        renderHook(() => useVisibility<HTMLDivElement>(true));
        expect(mockObserve).not.toHaveBeenCalled();
    });

    it('should create observer with rootMargin 50px', () => {
        function TestComponent() {
            const { ref } = useVisibility<HTMLDivElement>(true);
            return <div ref={ref} />;
        }

        render(<TestComponent />, { wrapper });
        expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '50px' });
    });
});

function simulateIntersection(el: Element, isIntersecting: boolean) {
    const callback = observeCallbacks.get(el);
    if (callback) {
        callback([{ isIntersecting, target: el } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
}
