import { type AccountInfoWithJsonData } from '@solana/kit';
import { create } from 'superstruct';

import { EPOCH_NEVER_SET } from './constants';
import { StakeDelegationAccount } from './validators';

/**
 * Why an address has no delegation, kept apart so callers can tell the cases apart. Collapsing
 * them would report a missing account and an undelegated stake account the same way.
 */
export type StakeDelegation =
    | {
          kind: 'delegated';
          activationEpoch: number;
          /** Absent while still delegated — on-chain that is the `u64::MAX` sentinel. */
          deactivationEpoch?: number;
      }
    | { kind: 'not-found' }
    | { kind: 'not-a-stake-account' }
    | { kind: 'undelegated' };

/**
 * Reads the activation and deactivation epochs from a delegated stake account.
 *
 * Takes kit's `getAccountInfo(…, { encoding: 'jsonParsed' })` value. The parameter is structural
 * rather than kit's full `AccountInfoBase & AccountInfoWithJsonData` so a caller can hand over the
 * response value as-is and a test can build one without the account envelope.
 *
 * `create` rather than `is`: `activationEpoch` and `deactivationEpoch` arrive as strings and the
 * validator coerces them to bigint, which `is` would reject. A failed parse is a caller error to
 * report, not something to propagate, so the throw is caught.
 */
export function parseStakeDelegation(
    account: { data: AccountInfoWithJsonData['data'] } | null | undefined,
): StakeDelegation {
    if (!account) {
        return { kind: 'not-found' };
    }

    // A `[base64, 'base64']` tuple means the RPC could not parse the account, so it is not a stake
    // account as far as we can tell.
    const { data } = account;
    if (Array.isArray(data)) {
        return { kind: 'not-a-stake-account' };
    }

    let stake;
    try {
        stake = create(data.parsed, StakeDelegationAccount).info.stake;
    } catch {
        return { kind: 'not-a-stake-account' };
    }

    // An initialized stake account that was never delegated has no activation epoch, so there is
    // no range to sum. Reporting zero would be a claim about the account we cannot support.
    if (!stake) {
        return { kind: 'undelegated' };
    }

    const { activationEpoch, deactivationEpoch } = stake.delegation;

    return {
        activationEpoch: Number(activationEpoch),
        deactivationEpoch: deactivationEpoch === EPOCH_NEVER_SET ? undefined : Number(deactivationEpoch),
        kind: 'delegated',
    };
}
