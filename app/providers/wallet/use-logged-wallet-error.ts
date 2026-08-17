'use client';

import { useEffect } from 'react';

import { Logger } from '@/app/shared/lib/logger';

/**
 * Reports a wallet action's error state.
 *
 * The Kit wallet plugin has no `onError` callback — failures land on the action hook's `error`
 * instead, so something has to watch it for the failure to reach logging at all.
 */
export function useLoggedWalletError(error: unknown) {
    useEffect(() => {
        if (error) {
            Logger.error(error);
        }
    }, [error]);
}
