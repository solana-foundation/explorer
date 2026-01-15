'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hideFailedTransactions';

/**
 * Custom hook to manage the "hide failed transactions" filter preference.
 * State is persisted to localStorage and survives page reloads.
 *
 * @returns [hideFailedTxs, setHideFailedTxs] - Current state and setter function
 */
export function useHideFailedTransactions(): [boolean, (value: boolean) => void] {
    const [hideFailedTxs, setHideFailedTxsState] = useState<boolean>(() => {
        // Lazy initialization - read from localStorage on mount
        if (typeof window === 'undefined') {
            return false; // SSR safe default
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === 'true';
        } catch {
            // Handle localStorage access errors gracefully
            return false;
        }
    });

    useEffect(() => {
        // Sync state changes to localStorage
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, String(hideFailedTxs));
            } catch {
                // Handle localStorage write errors gracefully (e.g., quota exceeded)
                console.warn('Failed to save hideFailedTransactions preference to localStorage');
            }
        }
    }, [hideFailedTxs]);

    return [hideFailedTxs, setHideFailedTxsState];
}