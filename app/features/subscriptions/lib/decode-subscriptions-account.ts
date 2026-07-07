import type { Address, EncodedAccount } from '@solana/kit';
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

export type SubscriptionsAccountData =
    | { data: FixedDelegation; type: 'FixedDelegation' }
    | { data: Plan; type: 'Plan' }
    | { data: RecurringDelegation; type: 'RecurringDelegation' }
    | { data: SubscriptionAuthority; type: 'SubscriptionAuthority' }
    | { data: SubscriptionDelegation; type: 'SubscriptionDelegation' };

/**
 * Decode raw account bytes into the appropriate Subscriptions protocol account type.
 *
 * Returns `undefined` when:
 * - `data` is empty
 * - the discriminator byte is not one of the five known account types
 * - the codec rejects the bytes (e.g. length mismatch, corrupt data)
 */
export function decodeSubscriptionsAccount(address: string, data: Uint8Array): SubscriptionsAccountData | undefined {
    if (data.length === 0) return undefined;

    const discriminator = data[DISCRIMINATOR_OFFSET];
    const encoded = toEncodedAccount(address, data);

    try {
        switch (discriminator) {
            case AccountDiscriminator.FixedDelegation:
                return { data: decodeFixedDelegation(encoded).data, type: 'FixedDelegation' };
            case AccountDiscriminator.Plan:
                return { data: decodePlan(encoded).data, type: 'Plan' };
            case AccountDiscriminator.RecurringDelegation:
                return { data: decodeRecurringDelegation(encoded).data, type: 'RecurringDelegation' };
            case AccountDiscriminator.SubscriptionAuthority:
                return { data: decodeSubscriptionAuthority(encoded).data, type: 'SubscriptionAuthority' };
            case AccountDiscriminator.SubscriptionDelegation:
                return { data: decodeSubscriptionDelegation(encoded).data, type: 'SubscriptionDelegation' };
            default:
                return undefined;
        }
    } catch {
        return undefined;
    }
}

/**
 * Wraps raw bytes and address into the minimal {@link EncodedAccount} shape
 * required by Codama decoders. Only `data` is consumed during decode; the
 * remaining fields are carried through to the returned `Account<T>` unchanged.
 */
function toEncodedAccount(addr: string, data: Uint8Array): EncodedAccount<string> {
    return { address: addr as Address, data } as unknown as EncodedAccount<string>;
}
