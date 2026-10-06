import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTO_REFRESH_INTERVAL, AutoRefresh, useAutoRefreshInterval, useAutoRefreshState } from '../use-auto-refresh';

beforeEach(() => {
    vi.useFakeTimers();
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('useAutoRefreshState', () => {
    it.each([
        { args: { enabled: true, isTabVisible: true }, expected: 'Active', scenario: 'enabled + visible' },
        { args: { enabled: false, isTabVisible: true }, expected: 'Inactive', scenario: 'disabled' },
        {
            args: { bailedOut: true, enabled: true, isTabVisible: false },
            expected: 'Inactive',
            scenario: 'tab hidden — even if enabled and bailedOut',
        },
        {
            args: { bailedOut: true, enabled: true, isTabVisible: true },
            expected: 'BailedOut',
            scenario: 'bailedOut + visible (bailout wins over enabled)',
        },
    ] as const)('should return $expected when $scenario', ({ args, expected }) => {
        const { result } = renderHook(() => useAutoRefreshState(args));
        expect(result.current).toBe(AutoRefresh[expected]);
    });
});

describe('useAutoRefreshInterval', () => {
    it('should poll every interval while Active', () => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh.Active, onRefresh));
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 2));
        expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it.each(['Inactive', 'BailedOut'] as const)('should not poll when %s', state => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh[state], onRefresh));
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 2));
        expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should clear the interval on unmount', () => {
        const onRefresh = vi.fn();
        const { unmount } = renderHook(() => useAutoRefreshInterval(AutoRefresh.Active, onRefresh));
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL));
        expect(onRefresh).toHaveBeenCalledTimes(1);
        unmount();
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 3));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when autoRefresh flips away from Active', () => {
        const onRefresh = vi.fn();
        const { rerender } = renderHook(({ state }) => useAutoRefreshInterval(state, onRefresh), {
            initialProps: { state: AutoRefresh.Active },
        });
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL));
        expect(onRefresh).toHaveBeenCalledTimes(1);
        rerender({ state: AutoRefresh.BailedOut });
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 2));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should respect a custom intervalMs', () => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh.Active, onRefresh, 500));
        act(() => vi.advanceTimersByTime(1000));
        expect(onRefresh).toHaveBeenCalledTimes(2);
    });
});
