import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useHideFailedTransactions } from '../useHideFailedTransactions';

const STORAGE_KEY = 'hideFailedTransactions';

describe('useHideFailedTransactions', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        // Clean up after each test
        localStorage.clear();
    });

    it('should initialize with false when localStorage is empty', () => {
        const { result } = renderHook(() => useHideFailedTransactions());
        const [hideFailedTxs] = result.current;

        expect(hideFailedTxs).toBe(false);
    });

    it('should initialize with true when localStorage has "true"', () => {
        localStorage.setItem(STORAGE_KEY, 'true');

        const { result } = renderHook(() => useHideFailedTransactions());
        const [hideFailedTxs] = result.current;

        expect(hideFailedTxs).toBe(true);
    });

    it('should initialize with false when localStorage has "false"', () => {
        localStorage.setItem(STORAGE_KEY, 'false');

        const { result } = renderHook(() => useHideFailedTransactions());
        const [hideFailedTxs] = result.current;

        expect(hideFailedTxs).toBe(false);
    });

    it('should persist state to localStorage when set to true', () => {
        const { result } = renderHook(() => useHideFailedTransactions());
        const [, setHideFailedTxs] = result.current;

        act(() => {
            setHideFailedTxs(true);
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(result.current[0]).toBe(true);
    });

    it('should persist state to localStorage when set to false', () => {
        localStorage.setItem(STORAGE_KEY, 'true');

        const { result } = renderHook(() => useHideFailedTransactions());
        const [, setHideFailedTxs] = result.current;

        act(() => {
            setHideFailedTxs(false);
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
        expect(result.current[0]).toBe(false);
    });

    it('should toggle state correctly', () => {
        const { result } = renderHook(() => useHideFailedTransactions());

        // Initial state is false
        expect(result.current[0]).toBe(false);

        // Toggle to true
        act(() => {
            result.current[1](true);
        });
        expect(result.current[0]).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('true');

        // Toggle to false
        act(() => {
            result.current[1](false);
        });
        expect(result.current[0]).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    });

    it('should preserve state across hook remounts', () => {
        // First render
        const { result: result1, unmount } = renderHook(() => useHideFailedTransactions());

        act(() => {
            result1.current[1](true);
        });

        expect(result1.current[0]).toBe(true);

        // Unmount and remount
        unmount();
        const { result: result2 } = renderHook(() => useHideFailedTransactions());

        // State should be preserved from localStorage
        expect(result2.current[0]).toBe(true);
    });

    it('should handle invalid localStorage values gracefully', () => {
        localStorage.setItem(STORAGE_KEY, 'invalid-value');

        const { result } = renderHook(() => useHideFailedTransactions());
        const [hideFailedTxs] = result.current;

        // Should default to false for invalid values
        expect(hideFailedTxs).toBe(false);
    });
});
