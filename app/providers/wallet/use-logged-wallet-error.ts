'use client';

import { useEffect } from 'react';

import { Logger } from '@/app/shared/lib/logger';

/**
 * Reports a wallet action's error state.
 *
 * The Kit wallet plugin has no `onError` callback — failures land on the action hook's `error`
 * instead, so something has to watch it for the failure to reach logging at all.
 *
 * Reported to Sentry rather than only the console: `NEXT_LOG_LEVEL` is a server-side variable, so
 * console output from a client component is always suppressed and a wallet failure would otherwise
 * leave no trace anywhere.
 */
export function useLoggedWalletError(error: unknown) {
    useEffect(() => {
        if (error) {
            Logger.error(error, { sentry: true });
        }
    }, [error]);
}
