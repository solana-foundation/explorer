import { act, render, screen } from '@testing-library/react';
import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMidTruncation } from '../useMidTruncation';

// ─── Minimal harness that wires the hook's refs to real DOM elements ───────────

function Harness({ enabled, text, withTrailing = false }: { enabled: boolean; text: string; withTrailing?: boolean }) {
    const trailingRef = useRef<HTMLButtonElement>(null);
    const { rowRef, hiddenTextRef, isMidTruncated, midTruncatedText } = useMidTruncation(
        enabled,
        text,
        withTrailing ? trailingRef : undefined,
    );
    return (
        <div ref={rowRef} data-testid="row">
            <span ref={hiddenTextRef} data-testid="hidden" />
            <span data-testid="state">{isMidTruncated ? 'truncated' : 'full'}</span>
            <span data-testid="mid-text">{midTruncatedText}</span>
            {withTrailing && <button ref={trailingRef} data-testid="trailing" />}
        </div>
    );
}

describe('useMidTruncation', () => {
    let triggerResize: () => void;

    beforeEach(() => {
        triggerResize = () => {};
        // jsdom does not implement ResizeObserver — assign a vi.fn stub directly
        global.ResizeObserver = vi.fn(cb => {
            triggerResize = () => act(() => cb([], {} as ResizeObserver));
            return { disconnect: vi.fn(), observe: vi.fn(), unobserve: vi.fn() };
        }) as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should format midTruncatedText as first-5 + "…" + last-5', () => {
        render(<Harness enabled text="So1111111111111111111111111111111111111111112" />);
        expect(screen.getByTestId('mid-text')).toHaveTextContent('So111…11112');
    });

    it('should not truncate when disabled', () => {
        render(<Harness enabled={false} text="So1111111111111111111111111111111111111111112" />);
        expect(screen.getByTestId('state')).toHaveTextContent('full');
    });

    it('should not truncate when text fits within available width', () => {
        render(<Harness enabled text="So1111111111111111111111111111111111111111112" />);

        const row = screen.getByTestId('row');
        const hidden = screen.getByTestId('hidden');

        // text (200px) < row (400px) − copyIcon (24px) = 376px → fits
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            return { width: this === hidden ? 200 : 0 } as DOMRect;
        });
        Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 400 });

        triggerResize();

        expect(screen.getByTestId('state')).toHaveTextContent('full');
    });

    it('should truncate when text overflows available width', () => {
        render(<Harness enabled text="So1111111111111111111111111111111111111111112" />);

        const row = screen.getByTestId('row');
        const hidden = screen.getByTestId('hidden');

        // text (400px) > row (200px) − copyIcon (24px) = 176px → overflows
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            return { width: this === hidden ? 400 : 0 } as DOMRect;
        });
        Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 200 });

        triggerResize();

        expect(screen.getByTestId('state')).toHaveTextContent('truncated');
    });

    it('should subtract trailing element width + margin from available width', () => {
        // trailingSpace is captured once at mount, so mocks must be in place before render.
        // Discriminate by tag: BUTTON = trailing (20px), SPAN = hidden text (200px).
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            if (this.tagName === 'BUTTON') return { width: 20 } as DOMRect;
            if (this.tagName === 'SPAN') return { width: 200 } as DOMRect;
            return { width: 0 } as DOMRect;
        });
        vi.spyOn(global, 'getComputedStyle').mockReturnValue({ marginInlineStart: '8px' } as CSSStyleDeclaration);

        render(<Harness enabled text="So1111111111111111111111111111111111111111112" withTrailing />);

        // trailing: 20px + 8px margin = 28px; available = 250 − 24 − 28 = 198px; text = 200px → overflows
        Object.defineProperty(screen.getByTestId('row'), 'clientWidth', { configurable: true, get: () => 250 });

        triggerResize();

        expect(screen.getByTestId('state')).toHaveTextContent('truncated');
    });

    it('should disconnect the ResizeObserver on unmount', () => {
        const disconnect = vi.fn();
        global.ResizeObserver = vi.fn(() => ({
            disconnect,
            observe: vi.fn(),
            unobserve: vi.fn(),
        })) as unknown as typeof ResizeObserver;

        const { unmount } = render(<Harness enabled text="abc" />);
        unmount();

        expect(disconnect).toHaveBeenCalledOnce();
    });

    it('should reset to untruncated when enabled switches to false', () => {
        const { rerender } = render(<Harness enabled text="So1111111111111111111111111111111111111111112" />);

        const row = screen.getByTestId('row');
        const hidden = screen.getByTestId('hidden');

        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            return { width: this === hidden ? 400 : 0 } as DOMRect;
        });
        Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => 200 });
        triggerResize();
        expect(screen.getByTestId('state')).toHaveTextContent('truncated');

        rerender(<Harness enabled={false} text="So1111111111111111111111111111111111111111112" />);

        expect(screen.getByTestId('state')).toHaveTextContent('full');
    });
});
