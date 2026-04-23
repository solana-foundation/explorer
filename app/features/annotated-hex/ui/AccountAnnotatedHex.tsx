'use client';

import { useAccountRegions } from '@entities/account';
import type { Account } from '@providers/accounts';
import { HexData } from '@shared/HexData';
import { ErrorBoundary } from 'react-error-boundary';

import { AnnotatedHexData } from './AnnotatedHexData';

type Props = {
    account: Account;
    rawData: Uint8Array | undefined;
};

/**
 * Thin adapter that bridges `useAccountRegions` (hook → RegionsState) and
 * `AnnotatedHexData` (presentational primitive).
 *
 * Two safety nets:
 * 1. When the hook returns a fallback state (no raw, oversize, unknown owner,
 *    multisig, unexpected length), render the existing `<HexData>` unchanged.
 *    This preserves the current UX for every address page where we cannot
 *    safely annotate.
 * 2. Any throw from the region builder (a future decoder with an unguarded
 *    edge case) is caught by an ErrorBoundary that falls back to `<HexData>`
 *    with the raw bytes. The address page never crashes because of us.
 */
export function AccountAnnotatedHex({ account, rawData }: Props) {
    return (
        <ErrorBoundary fallback={<HexData raw={rawData ?? new Uint8Array(0)} />}>
            <AccountAnnotatedHexInner account={account} rawData={rawData} />
        </ErrorBoundary>
    );
}

function AccountAnnotatedHexInner({ account, rawData }: Props) {
    const state = useAccountRegions(account, rawData);
    if (state.status !== 'regions' || !rawData) {
        return <HexData raw={rawData ?? new Uint8Array(0)} />;
    }
    return <AnnotatedHexData raw={rawData} regions={state.regions} />;
}
