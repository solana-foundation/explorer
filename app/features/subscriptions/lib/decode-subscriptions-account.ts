import type { Address, EncodedAccount, ReadonlyUint8Array } from '@solana/kit';
import {
    AccountDiscriminator,
    decodeFixedDelegation,
    decodePlan,
    decodeRecurringDelegation,
    decodeSubscriptionAuthority,
    decodeSubscriptionDelegation,
    DISCRIMINATOR_OFFSET,
    type FixedDelegation,
    type Plan,
    type RecurringDelegation,
    type SubscriptionAuthority,
    type SubscriptionDelegation,
} from '@solana/subscriptions';

import { Logger } from '@/app/shared/lib/logger';

export type SubscriptionsAccountData =
    | { parsed: FixedDelegation; program: 'FixedDelegation' }
    | { parsed: Plan; program: 'Plan' }
    | { parsed: RecurringDelegation; program: 'RecurringDelegation' }
    | { parsed: SubscriptionAuthority; program: 'SubscriptionAuthority' }
    | { parsed: SubscriptionDelegation; program: 'SubscriptionDelegation' };

/**
 * Decode raw account bytes into the appropriate Subscriptions protocol account type.
 *
 * Handles the five discriminator-bearing account types. The protocol's sixth account,
 * EventAuthority, is intentionally not handled here: it is an empty (0-byte) account
 * identified by PDA derivation (`findEventAuthorityPda`), not by a discriminator byte,
 * so it cannot be recognised from raw data alone.
 *
 * Returns `undefined` when:
 * - `data` is empty
 * - the discriminator byte is not one of the five known account types
 * - the codec rejects the bytes (e.g. length mismatch, corrupt data)
 */
export function decodeSubscriptionsAccount(
    address: string,
    data: ReadonlyUint8Array,
): SubscriptionsAccountData | undefined {
    if (data.length === 0) return undefined;

    const discriminator = data[DISCRIMINATOR_OFFSET];
    const encoded = toEncodedAccount(address, data);

    try {
        switch (discriminator) {
            case AccountDiscriminator.FixedDelegation:
                return { parsed: decodeFixedDelegation(encoded).data, program: 'FixedDelegation' };
            case AccountDiscriminator.Plan:
                return { parsed: decodePlan(encoded).data, program: 'Plan' };
            case AccountDiscriminator.RecurringDelegation:
                return { parsed: decodeRecurringDelegation(encoded).data, program: 'RecurringDelegation' };
            case AccountDiscriminator.SubscriptionAuthority:
                return { parsed: decodeSubscriptionAuthority(encoded).data, program: 'SubscriptionAuthority' };
            case AccountDiscriminator.SubscriptionDelegation:
                return { parsed: decodeSubscriptionDelegation(encoded).data, program: 'SubscriptionDelegation' };
            default:
                return undefined;
        }
    } catch (e) {
        Logger.error(e);
        return undefined;
    }
}

/**
 * Wraps raw bytes and address into the minimal {@link EncodedAccount} shape
 * required by Codama decoders. Only `data` is consumed during decode; the
 * remaining fields are carried through to the returned `Account<T>` unchanged.
 */
function toEncodedAccount(addr: string, data: ReadonlyUint8Array): EncodedAccount<string> {
    return { address: addr as Address, data } as unknown as EncodedAccount<string>;
}
