'use client';

import { useEffect, useState } from 'react';

import { getNickname } from '../lib/nicknames';

/**
 * Hook to manage nickname for a given address
 * Listens for nickname updates across all instances
 */
export function useNickname(address: string) {
    const [nickname, setNickname] = useState<string | null>(null);

    useEffect(() => {
        setNickname(getNickname(address));

        // Listen for nickname updates
        const handleNicknameUpdate = (event: CustomEvent) => {
            if (event.detail.address === address) {
                setNickname(getNickname(address));
            }
        };

        window.addEventListener('nicknameUpdated', handleNicknameUpdate as EventListener);
        return () => {
            window.removeEventListener('nicknameUpdated', handleNicknameUpdate as EventListener);
        };
    }, [address]);

    return nickname;
}
