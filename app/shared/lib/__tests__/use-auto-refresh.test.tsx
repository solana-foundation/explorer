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
    it('should return Active when enabled + visible', () => {
        const isTabVisible = true;
        const { result } = renderHook(() => useAutoRefreshState({ enabled: true, isTabVisible }));
        expect(result.current).toBe(AutoRefresh.Active);
    });

    it('should return Inactive when disabled', () => {
        const isTabVisible = true;
        const { result } = renderHook(() => useAutoRefreshState({ enabled: false, isTabVisible }));
        expect(result.current).toBe(AutoRefresh.Inactive);
    });

    it('should return Inactive when tab hidden — even if enabled and bailedOut', () => {
        const isTabVisible = false;
        const { result } = renderHook(() => useAutoRefreshState({ bailedOut: true, enabled: true, isTabVisible }));
        expect(result.current).toBe(AutoRefresh.Inactive);
    });

    it('should return BailedOut when bailedOut + visible (bailout wins over enabled)', () => {
        const isTabVisible = true;
        const { result } = renderHook(() => useAutoRefreshState({ bailedOut: true, enabled: true, isTabVisible }));
        expect(result.current).toBe(AutoRefresh.BailedOut);
    });
});

describe('useAutoRefreshInterval', () => {
    it('should poll every interval while Active', () => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh.Active, onRefresh));
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 2));
        expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('should not poll when Inactive', () => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh.Inactive, onRefresh));
        act(() => vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL * 2));
        expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should not poll when BailedOut', () => {
        const onRefresh = vi.fn();
        renderHook(() => useAutoRefreshInterval(AutoRefresh.BailedOut, onRefresh));
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
