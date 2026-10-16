import 'client-only';

import { useCluster, useSolanaRpc } from '@entities/cluster/@x/instruction-intent';
import type { KitInstruction } from '@explorer/parsers';
import { fetchEncodedAccounts } from '@solana/kit';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { toHex } from '@/app/shared/lib/bytes';
import { invariant } from '@/app/shared/lib/invariant';

import { computeInstructionIntent } from '../lib/compute-instruction-intent';
import {
    checkInstructionIntentExists,
    type InstructionIntentAvailability,
    type InstructionIntentResult,
    type IntentUnavailableReason,
} from '../lib/intent';
import { useCheckIntentSupport } from './use-check-intent-support';

// The panel owns Retry, and a computation failure is deterministic
const SWR_OPTIONS = { shouldRetryOnError: false } as const;
const IDLE: InstructionIntentResult = { status: 'idle' };
const LOADING: InstructionIntentResult = { status: 'loading' };

/**
 * The intent of one instruction.
 * Checks whether program has idl with intent templates.
 * Checks whether instruction has intent.
 * Gets accounts required for the instruction intent, if necessary.
 * Compute intent sentence parts.
 * Everything is wrapped by statuses indicating the current state of the computation.
 */
export function useInstructionIntent({
    programId,
    ixIntentAvailability,
    enabled,
}: {
    programId: string;
    ixIntentAvailability: InstructionIntentAvailability;
    enabled: boolean;
}): InstructionIntentResult {
    const { cluster, url } = useCluster();
    const rpc = useSolanaRpc();
    const support = useCheckIntentSupport(programId);

    const root = support.status === 'supported' ? support.root : undefined;
    const instruction = ixIntentAvailability.status === 'present' ? ixIntentAvailability.instruction : undefined;

    const ixIntentExist = useMemo(
        () => (root && instruction ? checkInstructionIntentExists(root, instruction) : undefined),
        [root, instruction],
    );
    const ixIntentFound = ixIntentExist?.status === 'exists' ? ixIntentExist : undefined;

    // SWR calls a fetcher only while its key is set, so the `&&` guards in the fetchers only narrow the types
    const accountRead = useSWRImmutable(
        enabled && ixIntentFound && ixIntentFound.addresses.length > 0
            ? ['instruction-intent-accounts', cluster, url, ...ixIntentFound.addresses]
            : undefined,
        () => ixIntentFound && fetchEncodedAccounts(rpc, [...ixIntentFound.addresses]),
        SWR_OPTIONS,
    );

    const computeInput =
        enabled && root && instruction && ixIntentFound && (ixIntentFound.addresses.length === 0 || accountRead.data)
            ? { accounts: accountRead.data ?? [], instruction, parsed: ixIntentFound.parsed, root }
            : undefined;

    const computedIxIntent = useSWRImmutable(
        computeInput ? ['instruction-intent', cluster, url, toContentKey(computeInput.instruction)] : undefined,
        () => computeInput && computeInstructionIntent(computeInput),
        SWR_OPTIONS,
    );

    const waiting = enabled ? LOADING : IDLE;
    if (support.status === 'loading') return waiting;
    if (support.status === 'failed') return unavailable('idl-failed');
    if (support.status === 'none') return unavailable('no-metadata');
    if (support.status === 'unsupported') return unavailable('malformed-metadata');
    if (ixIntentAvailability.status === 'pending') return waiting;
    if (ixIntentAvailability.status === 'absent') return { retry: ixIntentAvailability.retry, status: 'failed' };

    invariant(ixIntentExist, 'The existence check runs whenever the root and the instruction are set');
    if (ixIntentExist.status === 'unavailable') return unavailable(ixIntentExist.reason);
    if (!enabled) return IDLE;

    // The result wins: a refresh of a shared account entry must not replace a sentence already shown
    if (computedIxIntent.data) return { result: computedIxIntent.data, status: 'ready' };
    if (computedIxIntent.error) return unavailable('malformed-metadata');
    // SWR keeps the last error while a Retry runs
    if (accountRead.error && !accountRead.isValidating) {
        // The wrapper drops the click event, which `mutate` would store as data
        return { retry: () => void accountRead.mutate(), status: 'failed' };
    }
    return LOADING;
}

function unavailable(reason: IntentUnavailableReason): InstructionIntentResult {
    return { reason, status: 'unavailable' };
}

function toContentKey({ programAddress, accounts, data }: KitInstruction): string {
    return `${programAddress}:${accounts.map(account => account.address).join(',')}:${toHex(data)}`;
}
