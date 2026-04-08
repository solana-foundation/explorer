'use client';

import { sha256 } from '@noble/hashes/sha256';
import { useCluster } from '@providers/cluster';
import { Connection, type VersionedMessage } from '@solana/web3.js';
import { useCallback, useMemo } from 'react';
import useSWRMutation from 'swr/mutation';

import { toHex } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { simulateTransaction, type SimulationResult } from '../lib/simulate-transaction';

export type SimulationState =
    | { status: 'idle'; simulate: () => void }
    | { status: 'simulating' }
    | { status: 'done'; result: SimulationResult; simulate: () => void }
    | { status: 'error'; error: string; simulate: () => void };

type AccountBalances = { preBalances: number[]; postBalances: number[] };

type SimulationArg = {
    message: VersionedMessage;
    cluster: ReturnType<typeof useCluster>['cluster'];
    accountBalances: AccountBalances | undefined;
};

export function useSimulation(message: VersionedMessage, accountBalances?: AccountBalances): SimulationState {
    const { cluster, url } = useCluster();

    const connection = useMemo(() => new Connection(url, 'confirmed'), [url]);

    // Fingerprint the message so the SWR key changes when the transaction changes,
    // preventing stale cached data from flashing for a different transaction.
    const messageFingerprint = useMemo(() => messageToFingerprint(message), [message]);

    const { trigger, data, error, isMutating } = useSWRMutation(
        ['simulate', url, messageFingerprint],
        (_key: unknown, { arg }: { arg: SimulationArg }) =>
            simulateTransaction({
                accountBalances: arg.accountBalances,
                cluster: arg.cluster,
                connection,
                message: arg.message,
            }),
        {
            onError: (cause: unknown) => {
                Logger.error(new Error('Simulation failed', { cause }));
            },
            throwOnError: false,
        },
    );

    const simulate = useCallback(
        () => void trigger({ accountBalances, cluster, message }),
        [trigger, accountBalances, cluster, message],
    );

    if (isMutating) return { status: 'simulating' };

    if (error) {
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
            simulate,
            status: 'error',
        };
    }

    if (data) {
        return {
            result: data,
            simulate,
            status: 'done',
        };
    }

    return { simulate, status: 'idle' };
}

/**
 * Derive a short hex fingerprint from a VersionedMessage for use as a cache key.
 * Hashes the raw key bytes to keep the key compact regardless of account count.
 */
function messageToFingerprint(message: VersionedMessage): string {
    return toHex(sha256(Uint8Array.from(message.serialize())));
}
