import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnixTime } from '../use-unix-time';

describe('useUnixTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should move forward while the page stays open', () => {
        const { result } = renderHook(() => useUnixTime());
        const start = result.current;

        act(() => {
            vi.advanceTimersByTime(60_000);
        });

        // An open vesting view must pass unlock times without a reload or another re-render.
        expect(result.current).toBeGreaterThanOrEqual(start + 45);
    });
});
