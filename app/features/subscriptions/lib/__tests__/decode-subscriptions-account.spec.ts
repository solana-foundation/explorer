import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    getFixedDelegationEncoder,
    getPlanEncoder,
    getRecurringDelegationEncoder,
    getSubscriptionAuthorityEncoder,
    getSubscriptionDelegationEncoder,
    PlanStatus,
} from '@solana/subscriptions';
import { describe, expect, it } from 'vitest';

import { gen } from '@__fixtures__/gen';

import { decodeSubscriptionsAccount } from '../decode-subscriptions-account';

// A valid Solana address used as placeholder for all address fields in fixtures.
const ZERO = address(gen.address(0));

// ─── Fixtures built with the SDK's own encoders ────────────────────────────────
// Using the same codecs for encoding and decoding is the canonical way to
// produce valid byte sequences without hand-crafting binary layouts.
// The SDK's FixedSizeEncoder.encode() returns ReadonlyUint8Array at the type
// level but a regular Uint8Array at runtime; the cast makes the types line up.
function encode<T>(encoder: { encode: (v: T) => unknown }, value: T): Uint8Array {
    return encoder.encode(value) as unknown as Uint8Array;
}

const PLAN_BYTES = encode(getPlanEncoder(), {
    bump: 255,
    data: {
        destinations: [ZERO, ZERO, ZERO, ZERO],
        endTs: 0n,
        metadataUri: '',
        mint: ZERO,
        planId: 42n,
        pullers: [ZERO, ZERO, ZERO, ZERO],
        terms: { amount: 1_000n, createdAt: 0n, periodHours: 24n },
    },
    discriminator: AccountDiscriminator.Plan,
    owner: ZERO,
    status: PlanStatus.Active,
});

const FIXED_DELEGATION_BYTES = encode(getFixedDelegationEncoder(), {
    amount: 500n,
    expiryTs: 1_999_999_999n,
    header: {
        bump: 253,
        delegatee: ZERO,
        delegator: ZERO,
        discriminator: AccountDiscriminator.FixedDelegation,
        initId: 1n,
        payer: ZERO,
        version: 1,
    },
    mint: ZERO,
    subscriptionAuthority: ZERO,
});

const RECURRING_DELEGATION_BYTES = encode(getRecurringDelegationEncoder(), {
    amountPerPeriod: 100n,
    amountPulledInPeriod: 0n,
    currentPeriodStartTs: 0n,
    expiryTs: 1_999_999_999n,
    header: {
        bump: 252,
        delegatee: ZERO,
        delegator: ZERO,
        discriminator: AccountDiscriminator.RecurringDelegation,
        initId: 2n,
        payer: ZERO,
        version: 1,
    },
    mint: ZERO,
    periodLengthS: 86_400n,
    subscriptionAuthority: ZERO,
});

const SUBSCRIPTION_DELEGATION_BYTES = encode(getSubscriptionDelegationEncoder(), {
    amountPulledInPeriod: 0n,
    currentPeriodStartTs: 0n,
    expiresAtTs: 1_999_999_999n,
    header: {
        bump: 251,
        delegatee: ZERO,
        delegator: ZERO,
        discriminator: AccountDiscriminator.SubscriptionDelegation,
        initId: 3n,
        payer: ZERO,
        version: 1,
    },
    terms: { amount: 200n, createdAt: 0n, periodHours: 48n },
});

const SUBSCRIPTION_AUTHORITY_BYTES = encode(getSubscriptionAuthorityEncoder(), {
    bump: 254,
    discriminator: AccountDiscriminator.SubscriptionAuthority,
    initId: 1n,
    payer: ZERO,
    tokenMint: ZERO,
    user: ZERO,
});

describe('decodeSubscriptionsAccount', () => {
    it('should decode a Plan account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', PLAN_BYTES);
        expect(result?.program).toBe('Plan');
        if (result?.program !== 'Plan') return;
        expect(result.parsed.data.planId).toBe(42n);
        expect(result.parsed.data.terms.amount).toBe(1_000n);
        expect(result.parsed.data.terms.periodHours).toBe(24n);
        expect(result.parsed.owner).toBe(ZERO);
    });

    it('should decode a FixedDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', FIXED_DELEGATION_BYTES);
        expect(result?.program).toBe('FixedDelegation');
        if (result?.program !== 'FixedDelegation') return;
        expect(result.parsed.amount).toBe(500n);
        expect(result.parsed.expiryTs).toBe(1_999_999_999n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.FixedDelegation);
    });

    it('should decode a RecurringDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', RECURRING_DELEGATION_BYTES);
        expect(result?.program).toBe('RecurringDelegation');
        if (result?.program !== 'RecurringDelegation') return;
        expect(result.parsed.amountPerPeriod).toBe(100n);
        expect(result.parsed.periodLengthS).toBe(86_400n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.RecurringDelegation);
    });

    it('should decode a SubscriptionDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', SUBSCRIPTION_DELEGATION_BYTES);
        expect(result?.program).toBe('SubscriptionDelegation');
        if (result?.program !== 'SubscriptionDelegation') return;
        expect(result.parsed.terms.amount).toBe(200n);
        expect(result.parsed.terms.periodHours).toBe(48n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.SubscriptionDelegation);
    });

    it('should decode a SubscriptionAuthority account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', SUBSCRIPTION_AUTHORITY_BYTES);
        expect(result?.program).toBe('SubscriptionAuthority');
        if (result?.program !== 'SubscriptionAuthority') return;
        expect(result.parsed.user).toBe(ZERO);
        expect(result.parsed.bump).toBe(254);
    });

    it('should return undefined for an empty buffer', () => {
        expect(decodeSubscriptionsAccount('addr', new Uint8Array())).toBeUndefined();
    });

    it('should return undefined for an unknown discriminator byte', () => {
        expect(decodeSubscriptionsAccount('addr', new Uint8Array([255, 0, 0, 0]))).toBeUndefined();
    });

    it('should return undefined when data is too short for the declared type', () => {
        // Valid Plan discriminator but only a handful of bytes — codec will throw
        // and the function must swallow it and return undefined.
        expect(decodeSubscriptionsAccount('addr', new Uint8Array([AccountDiscriminator.Plan, 0, 1]))).toBeUndefined();
    });
});
