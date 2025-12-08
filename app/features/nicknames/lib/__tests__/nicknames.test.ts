/**
 * Tests for nickname localStorage utility functions
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getNickname, removeNickname, setNickname } from '../nicknames';

describe('nicknames', () => {
    // Clear localStorage before each test for isolation
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getNickname', () => {
        it('returns null when no nickname exists', () => {
            const result = getNickname('TestAddress123');
            expect(result).toBeNull();
        });

        it('returns the nickname when it exists', () => {
            // Setup: add nickname to localStorage
            localStorage.setItem(
                'solana-explorer-nicknames',
                JSON.stringify({
                    TestAddress123: 'My Wallet',
                })
            );

            const result = getNickname('TestAddress123');
            expect(result).toBe('My Wallet');
        });

        it('handles invalid JSON gracefully', () => {
            // Setup: corrupt localStorage data
            localStorage.setItem('solana-explorer-nicknames', 'invalid-json');

            const result = getNickname('TestAddress123');
            expect(result).toBeNull();
        });
    });

    describe('setNickname', () => {
        it('saves a nickname to localStorage', () => {
            setNickname('TestAddress123', 'My Wallet');

            // Verify it was saved correctly
            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['TestAddress123']).toBe('My Wallet');
        });

        it('trims whitespace from nicknames', () => {
            setNickname('TestAddress123', '  My Wallet  ');

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['TestAddress123']).toBe('My Wallet');
        });

        it('removes nickname when empty string provided', () => {
            // Setup: save a nickname
            setNickname('TestAddress123', 'My Wallet');

            // Update with empty/whitespace-only string
            setNickname('TestAddress123', '   ');

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['TestAddress123']).toBeUndefined();
        });

        it('preserves other nicknames', () => {
            setNickname('Address1', 'Wallet 1');
            setNickname('Address2', 'Wallet 2');

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['Address1']).toBe('Wallet 1');
            expect(stored['Address2']).toBe('Wallet 2');
        });

        it('dispatches nicknameUpdated event', () => {
            const listener = vi.fn();
            window.addEventListener('nicknameUpdated', listener);

            setNickname('TestAddress123', 'My Wallet');

            // Verify event was dispatched with correct address
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { address: 'TestAddress123' },
                })
            );

            window.removeEventListener('nicknameUpdated', listener);
        });

        it('truncates nicknames longer than MAX_NICKNAME_LENGTH', () => {
            const longNickname = 'This is a very long nickname that exceeds the maximum allowed length';
            setNickname('TestAddress123', longNickname);

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['TestAddress123']).toBe(longNickname.slice(0, 32));
            expect(stored['TestAddress123'].length).toBe(32);
        });
    });

    describe('removeNickname', () => {
        it('removes a nickname from localStorage', () => {
            // Setup: save a nickname first
            setNickname('TestAddress123', 'My Wallet');

            removeNickname('TestAddress123');

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['TestAddress123']).toBeUndefined();
        });

        it('preserves other nicknames when removing one', () => {
            // Setup: save multiple nicknames
            setNickname('Address1', 'Wallet 1');
            setNickname('Address2', 'Wallet 2');

            removeNickname('Address1');

            const stored = JSON.parse(localStorage.getItem('solana-explorer-nicknames') || '{}');
            expect(stored['Address1']).toBeUndefined();
            expect(stored['Address2']).toBe('Wallet 2');
        });

        it('dispatches nicknameUpdated event', () => {
            const listener = vi.fn();
            window.addEventListener('nicknameUpdated', listener);

            removeNickname('TestAddress123');

            // Verify event was dispatched with correct address
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: { address: 'TestAddress123' },
                })
            );

            window.removeEventListener('nicknameUpdated', listener);
        });
    });
});
