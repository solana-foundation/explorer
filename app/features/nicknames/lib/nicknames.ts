'use client';

import { getOwn } from '@shared/lib/object';

import { Logger } from '@/app/shared/lib/logger';

/**
 * Utility functions for managing wallet address nicknames in localStorage
 */

const STORAGE_KEY = 'solana-explorer-nicknames';
export const MAX_NICKNAME_LENGTH = 32;

export const getNickname = (address: string): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        const nicknames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return getOwn(nicknames, address) || null;
    } catch (error) {
        Logger.error(error);
        return null;
    }
};

export const setNickname = (address: string, nickname: string): void => {
    if (typeof window === 'undefined') return;

    try {
        const nicknames = new Map(Object.entries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')));
        const trimmedNickname = nickname.trim();
        if (trimmedNickname) {
            // Truncate to max length
            nicknames.set(address, trimmedNickname.slice(0, MAX_NICKNAME_LENGTH));
        } else {
            nicknames.delete(address);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(nicknames)));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('nicknameUpdated', { detail: { address } }));
    } catch (error) {
        Logger.error(error);
    }
};

export const removeNickname = (address: string): void => {
    if (typeof window === 'undefined') return;

    try {
        const nicknames = new Map(Object.entries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')));
        nicknames.delete(address);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(nicknames)));

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('nicknameUpdated', { detail: { address } }));
    } catch (error) {
        Logger.error(error);
    }
};
