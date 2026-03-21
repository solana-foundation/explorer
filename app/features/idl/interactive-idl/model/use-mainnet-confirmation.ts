import { getCookie, setCookie } from '@features/cookie';
import { Cluster } from '@utils/cluster';
import { useCallback, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';

const MAINNET_DISCLAIMER_COOKIE = 'idl_mainnet_accepted';
const COOKIE_MAX_AGE = 182 * 24 * 60 * 60;

type PendingAction<T> = {
    action: () => Promise<void> | void;
    context?: T;
};

/**
 * Hook that provides a confirmation flow for mainnet transactions.
 * Returns a function that will either execute immediately (non-mainnet) or
 * prompt for confirmation (mainnet). Once accepted, the disclaimer is
 * persisted in a cookie.
 */
export function useMainnetConfirmation<T = unknown>() {
    const { cluster: currentCluster } = useCluster();
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction<T> | null>(null);

    const requireConfirmation = useCallback(
        async (action: () => Promise<void> | void, context?: T) => {
            if (currentCluster === Cluster.MainnetBeta && !getCookie(MAINNET_DISCLAIMER_COOKIE)) {
                setPendingAction({ action, context });
                setIsOpen(true);
            } else {
                await action();
            }
        },
        [currentCluster],
    );

    const confirm = useCallback(async () => {
        if (pendingAction) {
            setCookie(MAINNET_DISCLAIMER_COOKIE, 'true', COOKIE_MAX_AGE);
            setIsOpen(false);
            try {
                await pendingAction.action();
            } finally {
                setPendingAction(null);
            }
        }
    }, [pendingAction]);

    const cancel = useCallback(() => {
        setIsOpen(false);
        setPendingAction(null);
    }, []);

    return {
        cancel,
        confirm,
        hasPendingAction: pendingAction !== null,
        isOpen,
        requireConfirmation,
    };
}
