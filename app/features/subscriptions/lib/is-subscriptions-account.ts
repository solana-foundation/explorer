import type { Account } from '@providers/accounts';

import { SUBSCRIPTIONS_ADDRESS } from './constants';
import { decodeSubscriptionsAccount } from './decode-subscriptions-account';

/**
 * Returns `true` when the account is owned by the Subscriptions program and
 * its raw bytes successfully decode to one of the five known account types
 * (Plan, FixedDelegation, RecurringDelegation, SubscriptionDelegation,
 * SubscriptionAuthority). Used by the account-page layout to gate tab visibility.
 */
export function isSubscriptionsAccount(account: Account): boolean {
    if (account.owner.toBase58() !== SUBSCRIPTIONS_ADDRESS) return false;
    if (!account.data.raw) return false;
    return Boolean(decodeSubscriptionsAccount(account.pubkey.toBase58(), account.data.raw));
}
