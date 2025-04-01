'use client';

import { AccountHeader } from '@components/common/Account';
import { useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { StatusType } from '@/app/components/shared/StatusBadge';

import { TokenExtensionsSection } from './TokenExtensionsSection';

export type ExtensionStatus = StatusType;

export interface TokenExtension {
    id: string;
    name: string;
    tooltip: string;
    description: string;
    status: ExtensionStatus;
    externalLinks: { label: string; url: string }[];
}

export function TokenExtensionsCard({ address }: { address: string }) {
    const accountInfo = useAccountInfo(address);
    const refresh = useFetchAccountInfo();

    if (!accountInfo?.data) return null;
    const account = accountInfo.data;

    const extensions: TokenExtension[] = [
        {
            description: 'Global control over token supply.',
            externalLinks: [{ label: 'Docs', url: 'https://docs.example.com/permanentDelegate' }],
            id: 'permanent-delegate',
            name: 'permanentDelegate',
            status: 'active',
            tooltip:
                "Designates an address with unrestricted authority to transfer or burn tokens from any account associated with a specific mint, effectively granting global control over that token's supply.",
        },
        {
            description: 'Token transfer fee configuration.',
            externalLinks: [{ label: 'Docs', url: 'https://docs.example.com/transferFeeConfig' }],
            id: 'transfer-fee-config',
            name: 'transferFeeConfig',
            status: 'inactive',
            tooltip:
                'Specifies the parameters for charging fees on token transfers, including the percentage fee, the maximum fee, and the authorities responsible for configuring these fees and withdrawing the collected amounts.',
        },
    ];

    return (
        <div className="card">
            <AccountHeader title="Extensions" refresh={() => refresh(account.pubkey, 'parsed')} />
            <div className="card-body">
                <TokenExtensionsSection extensions={extensions} />
            </div>
        </div>
    );
}
