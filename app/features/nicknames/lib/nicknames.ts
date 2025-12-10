'use client';

/**
 * Utility functions for managing wallet address nicknames in localStorage
 */

const STORAGE_KEY = 'solana-explorer-nicknames';
export const MAX_NICKNAME_LENGTH = 32;

export const getNickname = (address: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        const nicknames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return nicknames[address] || null;
    } catch (error) {
        console.error('Error reading nicknames from localStorage:', error);
        return null;
    }
};

export const setNickname = (address: string, nickname: string): void => {
    if (typeof window === 'undefined') return;

    try {
        const nicknames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const trimmedNickname = nickname.trim();
        if (trimmedNickname) {
            // Truncate to max length
            nicknames[address] = trimmedNickname.slice(0, MAX_NICKNAME_LENGTH);
        } else {
            delete nicknames[address];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nicknames));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('nicknameUpdated', { detail: { address } }));
    } catch (error) {
        console.error('Error saving nickname to localStorage:', error);
    }
};

export const removeNickname = (address: string): void => {
    if (typeof window === 'undefined') return;

    try {
        const nicknames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        delete nicknames[address];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nicknames));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('nicknameUpdated', { detail: { address } }));
    } catch (error) {
        console.error('Error removing nickname from localStorage:', error);
    }
};
