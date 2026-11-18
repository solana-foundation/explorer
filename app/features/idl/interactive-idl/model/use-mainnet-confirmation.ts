import { getStoredValue, setStoredValue } from '@features/cookie';
import { Cluster } from '@utils/cluster';
import { useCallback, useState } from 'react';
import { literal } from 'superstruct';

import { useCluster } from '@/app/providers/cluster';

const MAINNET_DISCLAIMER_KEY = 'idl_mainnet_accepted';
const ACCEPTANCE_MAX_AGE_SECONDS = 182 * 24 * 60 * 60;

type PendingAction<T> = {
    action: () => Promise<void> | void;
    context?: T;
};

/**
 * Hook that provides a confirmation flow for mainnet transactions.
 * Returns a function that will either execute immediately (non-mainnet) or
 * prompt for confirmation (mainnet). Once accepted, the disclaimer is
 * persisted in localStorage.
 */
export function useMainnetConfirmation<T = unknown>() {
    const { cluster: currentCluster } = useCluster();
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction<T> | null>(null);

    const requireConfirmation = useCallback(
        async (action: () => Promise<void> | void, context?: T) => {
            if (currentCluster === Cluster.Mainnet && !getStoredValue(MAINNET_DISCLAIMER_KEY, literal('true'))) {
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
            setStoredValue(MAINNET_DISCLAIMER_KEY, 'true', ACCEPTANCE_MAX_AGE_SECONDS);
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
