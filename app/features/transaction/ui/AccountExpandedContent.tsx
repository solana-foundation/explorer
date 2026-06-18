import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { cn } from '@components/shared/utils';
import { AccountInfo, useAccountExpandedInfo } from '@entities/account';
import { Account } from '@providers/accounts';
import { RawDataField } from '@shared/RawDataField';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Skeleton } from '@shared/ui/skeleton';
import React from 'react';
import { Code, Info } from 'react-feather';

import { DetailRow, FlatContext } from './AccountExpandedLayout';
import { ParsedSection } from './AccountExpandedSections';

type InnerProps = {
    accountInfo?: AccountInfo;
    accountInfoLoading?: boolean;
    address: string;
    data: Account;
    flat?: boolean;
};

export function AccountExpandedContentInner({ accountInfo, accountInfoLoading, address, data, flat }: InnerProps) {
    const dataSizeCell =
        accountInfo && accountInfo.size > 0 ? (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="e-h-auto !e-p-0 !e-text-sm">
                        <Code size={11} />
                        <span>{accountInfo.size.toLocaleString('en-US')} byte(s)</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="e-mx-4 e-w-auto !e-rounded-lg e-border-none e-p-0" align="end">
                    <RawDataField data={accountInfo.data} filename={address} loading={accountInfoLoading} />
                </PopoverContent>
            </Popover>
        ) : (
            <span>{(data.space ?? 0).toLocaleString('en-US')} byte(s)</span>
        );

    return (
        <div className={cn(flat ? 'e-pb-2.5' : 'e-ml-14 e-pb-10')}>
            {data.data.parsed && <ParsedSection parsed={data.data.parsed} />}
            <DetailRow label="Assigned Program Id">
                <Address pubkey={data.owner} link />
            </DetailRow>
            <DetailRow label="Allocated Data Size">{dataSizeCell}</DetailRow>
            <DetailRow label="Executable">{data.executable ? 'Yes' : 'No'}</DetailRow>
            <DetailRow label="Balance">
                <SolBalance lamports={data.lamports} />
            </DetailRow>

            <div
                className={cn(
                    'e-mt-3 e-flex e-items-center e-gap-1.5 e-text-xs e-text-outer-space-300',
                    flat && '!e-items-start e-px-4',
                )}
            >
                <Info size={13} />
                <span>Current account data. This data may have been different at the time of the transaction.</span>
            </div>
        </div>
    );
}

type Props = {
    accountInfo?: AccountInfo;
    accountInfoLoading?: boolean;
    address: string;
    enabled: boolean;
    flat?: boolean;
};

export function AccountExpandedContent({ accountInfo, accountInfoLoading, address, enabled, flat }: Props) {
    const { data, isError, isLoading } = useAccountExpandedInfo(address, enabled);

    if (enabled && isLoading) {
        return (
            <div className={cn(flat ? 'e-pb-2.5' : 'e-ml-14 e-pb-2.5')}>
                {[120, 160, 100, 80].map((w, i) => (
                    <div
                        key={i}
                        className={cn(
                            'e-grid e-grid-cols-[clamp(100px,25%,200px)_1fr] e-items-baseline e-gap-2 e-py-1.5',
                            flat ? 'e-px-4' : 'e-pr-3 md:e-pr-4',
                        )}
                    >
                        <Skeleton className="e-h-3.5 e-w-24" />
                        <Skeleton className="e-h-3.5" style={{ width: w }} />
                    </div>
                ))}
            </div>
        );
    }

    if (enabled && isError) {
        return (
            <div
                className={cn(
                    flat ? 'e-px-4 e-py-3' : 'e-ml-10 e-px-3 e-py-3 md:e-px-4',
                    'e-text-sm e-text-outer-space-300',
                )}
            >
                Failed to load account info
            </div>
        );
    }

    if (!data) return undefined;

    return (
        <FlatContext.Provider value={flat ?? false}>
            <AccountExpandedContentInner
                accountInfo={accountInfo}
                accountInfoLoading={accountInfoLoading}
                address={address}
                data={data}
                flat={flat}
            />
        </FlatContext.Provider>
    );
}
