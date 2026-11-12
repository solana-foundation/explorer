import 'client-only';

import { useCluster, useSolanaRpc } from '@entities/cluster/@x/instruction-intent';
import type { KitInstruction } from '@explorer/parsers';
import { fetchEncodedAccounts } from '@solana/kit';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { toHex } from '@/app/shared/lib/bytes';
import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';

import { computeInstructionIntent } from '../lib/compute-instruction-intent';
import { getAccountsForIntent } from '../lib/get-accounts-for-intent';
import {
    checkInstructionIntentExists,
    type InstructionFetchResult,
    type InstructionIntentResult,
    type IntentUnavailableReason,
} from '../lib/intent';
import { IntentSdkLoadError } from '../lib/load-intent-sdk';
import { useCheckIntentSupport } from './use-check-intent-support';

// The panel owns Retry, and an SDK error repeats for the same IDL and instruction
const SWR_OPTIONS = { shouldRetryOnError: false } as const;
const IDLE: InstructionIntentResult = { status: 'idle' };
const LOADING: InstructionIntentResult = { status: 'loading' };

/** The intent state of one card. The account fetch and the computation start on the first open. */
export function useInstructionIntent({
    programId,
    ixFetchResult,
    enabled,
}: {
    programId: string;
    ixFetchResult: InstructionFetchResult;
    enabled: boolean;
}): InstructionIntentResult {
    const { cluster, url } = useCluster();
    const rpc = useSolanaRpc();
    const support = useCheckIntentSupport(programId);

    const root = support.status === 'supported' ? support.root : undefined;
    const instruction = ixFetchResult.status === 'success' ? ixFetchResult.instruction : undefined;

    const ixIntentExist = useMemo(
        () => (root && instruction ? checkInstructionIntentExists(root, instruction) : undefined),
        [root, instruction],
    );
    const ixIntentFound = ixIntentExist?.status === 'exists' ? ixIntentExist : undefined;
    const contentKey = useMemo(() => instruction && toContentKey(instruction), [instruction]);
    const sdkOptions = {
        ...SWR_OPTIONS,
        onError: (error: unknown) =>
            Logger.error(new Error('Could not build the instruction intent', { cause: error }), {
                sentry: 'always',
                sentryExtras: { programId },
            }),
    };

    const addressesForIntent = useSWRImmutable(
        enabled && root && ixIntentFound ? ['instruction-intent-addresses', cluster, url, contentKey] : undefined,
        () => root && ixIntentFound && getAccountsForIntent(root, ixIntentFound.parsed),
        sdkOptions,
    );
    const addresses = addressesForIntent.data;
    const hasRequiredAddressesForIntent = addresses && addresses.length > 0;

    const accounts = useSWRImmutable(
        hasRequiredAddressesForIntent ? ['instruction-intent-accounts', cluster, url, ...addresses] : undefined,
        () => addresses && fetchEncodedAccounts(rpc, [...addresses]),
        SWR_OPTIONS,
    );

    const hasAccountsForIntent = addresses !== undefined && (addresses.length === 0 || accounts.data !== undefined);

    const computeInput =
        root && ixIntentFound && hasAccountsForIntent
            ? { accounts: accounts.data ?? [], parsed: ixIntentFound.parsed, root }
            : undefined;

    const computedIxIntent = useSWRImmutable(
        computeInput ? ['instruction-intent', cluster, url, contentKey] : undefined,
        () => computeInput && computeInstructionIntent(computeInput),
        sdkOptions,
    );

    const waiting = enabled ? LOADING : IDLE;
    if (support.status === 'loading') return waiting;
    if (support.status === 'failed') return unavailable('idl-failed');
    if (support.status === 'none') return unavailable('no-metadata');
    if (support.status === 'unsupported') return unavailable('malformed-metadata');
    if (ixFetchResult.status === 'loading') return waiting;
    if (ixFetchResult.status === 'failed') return { status: 'failed' };

    invariant(ixIntentExist, 'The existence check runs whenever the root and the instruction are set');
    if (ixIntentExist.status === 'unavailable') return unavailable(ixIntentExist.reason);
    if (!enabled) return IDLE;

    // The result wins: a refresh of a shared account entry must not replace a sentence already shown
    if (computedIxIntent.data) return { result: computedIxIntent.data, status: 'ready' };
    if (addressesForIntent.error instanceof IntentSdkLoadError) return failedWithRetry(addressesForIntent);
    if (computedIxIntent.error instanceof IntentSdkLoadError) return failedWithRetry(computedIxIntent);
    if (computedIxIntent.error || addressesForIntent.error) return unavailable('malformed-metadata');
    if (accounts.error) return failedWithRetry(accounts);
    return LOADING;
}

function unavailable(reason: IntentUnavailableReason): InstructionIntentResult {
    return { reason, status: 'unavailable' };
}

function failedWithRetry({
    isValidating,
    mutate,
}: {
    isValidating: boolean;
    mutate: () => Promise<unknown>;
}): InstructionIntentResult {
    // SWR keeps the last error while a Retry runs
    if (isValidating) return LOADING;
    // The wrapper drops the click event, which `mutate` would store as data
    return { retry: () => void mutate(), status: 'failed' };
}

function toContentKey({ programAddress, accounts, data }: KitInstruction): string {
    return `${programAddress}:${accounts.map(account => account.address).join(',')}:${toHex(data)}`;
}
