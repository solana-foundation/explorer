'use client';

import useSWRImmutable from 'swr/immutable';

import { deriveEventAuthorityAddress } from '../lib/event-authority';

/**
 * Resolves the Subscriptions program's event-authority PDA. The address is a pure
 * derivation (constant per program), so it is cached under a single SWR key.
 */
export function useEventAuthorityAddress(): string | undefined {
    const { data } = useSWRImmutable(['subscriptions-event-authority-pda'], deriveEventAuthorityAddress);
    return data;
}

/** Returns `true` when `accountAddress` is the Subscriptions event-authority PDA. */
export function useIsEventAuthority(accountAddress: string): boolean {
    // `useEventAuthorityAddress()` is `undefined` until derived, so an unresolved PDA
    // simply never matches — no explicit null/undefined guard needed.
    return useEventAuthorityAddress() === accountAddress;
}
