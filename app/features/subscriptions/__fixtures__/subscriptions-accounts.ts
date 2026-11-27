import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    type FixedDelegation,
    getFixedDelegationEncoder,
    getPlanEncoder,
    getRecurringDelegationEncoder,
    getSubscriptionAuthorityEncoder,
    getSubscriptionDelegationEncoder,
    type Plan,
    PlanStatus,
    type RecurringDelegation,
    type SubscriptionDelegation,
    SUBSCRIPTIONS_PROGRAM_ADDRESS,
} from '@solana/subscriptions';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

const ZERO = address('11111111111111111111111111111111');
export const USER = address(gen.address(1));
const MINT = address(gen.address(2));
const DELEGATEE = address(gen.address(3));

const HEADER = { delegatee: DELEGATEE, delegator: USER, payer: ZERO, version: 1 };

export const PLAN: Plan = {
    bump: 255,
    data: {
        destinations: [ZERO, ZERO, ZERO, ZERO],
        endTs: 0n,
        metadataUri: 'https://example.com/plan.json',
        mint: MINT,
        planId: 42n,
        pullers: [ZERO, ZERO, ZERO, ZERO],
        terms: { amount: 1_000_000n, createdAt: 0n, periodHours: 24n },
    },
    discriminator: AccountDiscriminator.Plan,
    owner: USER,
    status: PlanStatus.Active,
};

export const FIXED_DELEGATION: FixedDelegation = {
    amount: 500_000n,
    expiryTs: 1_999_999_999n,
    header: { ...HEADER, bump: 253, discriminator: AccountDiscriminator.FixedDelegation, initId: 1n },
    mint: MINT,
    subscriptionAuthority: ZERO,
};

export const RECURRING_DELEGATION: RecurringDelegation = {
    amountPerPeriod: 100_000n,
    amountPulledInPeriod: 25_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiryTs: 1_999_999_999n,
    header: { ...HEADER, bump: 252, discriminator: AccountDiscriminator.RecurringDelegation, initId: 2n },
    mint: MINT,
    periodLengthS: 86_400n,
    subscriptionAuthority: ZERO,
};

export const SUBSCRIPTION_DELEGATION: SubscriptionDelegation = {
    amountPulledInPeriod: 50_000n,
    currentPeriodStartTs: 1_700_000_000n,
    expiresAtTs: 1_999_999_999n,
    header: { ...HEADER, bump: 251, discriminator: AccountDiscriminator.SubscriptionDelegation, initId: 3n },
    terms: { amount: 200_000n, createdAt: 0n, periodHours: 48n },
};

export const PLAN_BYTES = new Uint8Array(getPlanEncoder().encode(PLAN));
export const FIXED_DELEGATION_BYTES = new Uint8Array(getFixedDelegationEncoder().encode(FIXED_DELEGATION));
export const RECURRING_DELEGATION_BYTES = new Uint8Array(getRecurringDelegationEncoder().encode(RECURRING_DELEGATION));
export const SUBSCRIPTION_DELEGATION_BYTES = new Uint8Array(
    getSubscriptionDelegationEncoder().encode(SUBSCRIPTION_DELEGATION),
);
export const SUBSCRIPTION_AUTHORITY_BYTES = new Uint8Array(
    getSubscriptionAuthorityEncoder().encode({
        bump: 254,
        discriminator: AccountDiscriminator.SubscriptionAuthority,
        initId: 7n,
        payer: ZERO,
        tokenMint: MINT,
        user: USER,
    }),
);

export function subscriptionsAccount(raw: Uint8Array): Account {
    return {
        data: { raw },
        executable: false,
        lamports: 1_000_000,
        owner: toLegacyPublicKey(address(SUBSCRIPTIONS_PROGRAM_ADDRESS)),
        pubkey: gen.publicKey(0),
        space: raw.length,
    };
}
