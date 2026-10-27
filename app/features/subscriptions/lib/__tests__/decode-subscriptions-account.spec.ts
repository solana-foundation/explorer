import {
    FIXED_DELEGATION_BYTES,
    PLAN_BYTES,
    RECURRING_DELEGATION_BYTES,
    SUBSCRIPTION_AUTHORITY_BYTES,
    SUBSCRIPTION_DELEGATION_BYTES,
    USER,
} from '@features/subscriptions/__fixtures__/subscriptions-accounts';
import { AccountDiscriminator } from '@solana/subscriptions';
import { describe, expect, it } from 'vitest';

import { decodeSubscriptionsAccount } from '../decode-subscriptions-account';

describe('decodeSubscriptionsAccount', () => {
    it('should decode a Plan account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', PLAN_BYTES);
        expect(result?.program).toBe('Plan');
        if (result?.program !== 'Plan') return;
        expect(result.parsed.data.planId).toBe(42n);
        expect(result.parsed.data.terms.amount).toBe(1_000_000n);
        expect(result.parsed.data.terms.periodHours).toBe(24n);
        expect(result.parsed.owner).toBe(USER);
    });

    it('should decode a FixedDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', FIXED_DELEGATION_BYTES);
        expect(result?.program).toBe('FixedDelegation');
        if (result?.program !== 'FixedDelegation') return;
        expect(result.parsed.amount).toBe(500_000n);
        expect(result.parsed.expiryTs).toBe(1_999_999_999n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.FixedDelegation);
    });

    it('should decode a RecurringDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', RECURRING_DELEGATION_BYTES);
        expect(result?.program).toBe('RecurringDelegation');
        if (result?.program !== 'RecurringDelegation') return;
        expect(result.parsed.amountPerPeriod).toBe(100_000n);
        expect(result.parsed.periodLengthS).toBe(86_400n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.RecurringDelegation);
    });

    it('should decode a SubscriptionDelegation account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', SUBSCRIPTION_DELEGATION_BYTES);
        expect(result?.program).toBe('SubscriptionDelegation');
        if (result?.program !== 'SubscriptionDelegation') return;
        expect(result.parsed.terms.amount).toBe(200_000n);
        expect(result.parsed.terms.periodHours).toBe(48n);
        expect(result.parsed.header.discriminator).toBe(AccountDiscriminator.SubscriptionDelegation);
    });

    it('should decode a SubscriptionAuthority account and expose its fields', () => {
        const result = decodeSubscriptionsAccount('addr', SUBSCRIPTION_AUTHORITY_BYTES);
        expect(result?.program).toBe('SubscriptionAuthority');
        if (result?.program !== 'SubscriptionAuthority') return;
        expect(result.parsed.user).toBe(USER);
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
