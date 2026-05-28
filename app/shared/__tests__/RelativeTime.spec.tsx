import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RelativeTime } from '../RelativeTime';

const NOW = new Date('2026-05-25T12:00:00Z').getTime();

describe('RelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render the relative time for a given timestamp', () => {
        const { container } = render(<RelativeTime date={NOW - 5 * 60_000} />);
        expect(container.textContent).toBe('5 minutes ago');
    });

    it('should render a <time> element with an ISO dateTime attribute', () => {
        const date = NOW - 5 * 60_000;
        render(<RelativeTime date={date} />);
        const time = screen.getByText('5 minutes ago');
        expect(time.tagName).toBe('TIME');
        expect(time.getAttribute('datetime')).toBe(new Date(date).toISOString());
    });

    it('should refresh the rendered string when the interval elapses', () => {
        const { container } = render(<RelativeTime date={NOW - 90 * 1000} />);
        expect(container.textContent).toBe('2 minutes ago');

        act(() => {
            vi.advanceTimersByTime(60_000);
        });
        expect(container.textContent).toBe('3 minutes ago');
    });

    it('should not schedule a timer when interval is 0', () => {
        const setInterval = vi.spyOn(globalThis, 'setInterval');
        render(<RelativeTime date={NOW} interval={0} />);
        expect(setInterval).not.toHaveBeenCalled();
    });

    it('should clear the timer on unmount', () => {
        const clearInterval = vi.spyOn(globalThis, 'clearInterval');
        const { unmount } = render(<RelativeTime date={NOW - 60_000} />);
        unmount();
        expect(clearInterval).toHaveBeenCalled();
    });
});
