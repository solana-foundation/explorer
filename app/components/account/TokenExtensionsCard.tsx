'use client';

import { AccountHeader } from '@components/common/Account';
import { useAccountInfo, useFetchAccountInfo } from '@providers/accounts';

import { TokenExtensionsSection } from './TokenExtensionsSection';

export function TokenExtensionsCard({ address }: { address: string }) {
    const accountInfo = useAccountInfo(address);
    const refresh = useFetchAccountInfo();

    if (!accountInfo?.data) return null;
    const account = accountInfo.data;

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(account.pubkey, 'parsed')} />
            <div className="card-body">
                <TokenExtensionsSection />
            </div>
        </div>
    );
}
