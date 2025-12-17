import { Cluster } from '@utils/cluster';
import { useCallback, useState } from 'react';

import { useCluster } from '@/app/providers/cluster';

type PendingAction<T> = {
    action: () => Promise<void> | void;
    context?: T;
};

/**
 * Hook that provides a confirmation flow for mainnet transactions.
 * Returns a function that will either execute immediately (non-mainnet) or
 * prompt for confirmation (mainnet).
 */
export function useMainnetConfirmation<T = unknown>() {
    const { cluster: currentCluster } = useCluster();
    const [isOpen, setIsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction<T> | null>(null);

    const requireConfirmation = useCallback(
        async (action: () => Promise<void> | void, context?: T) => {
            if (currentCluster === Cluster.MainnetBeta) {
                setPendingAction({ action, context });
                setIsOpen(true);
            } else {
                await action();
            }
        },
        [currentCluster]
    );

    const confirm = useCallback(async () => {
        if (pendingAction) {
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
