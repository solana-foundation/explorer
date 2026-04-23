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
