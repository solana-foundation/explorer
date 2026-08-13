import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { RawDataField } from '@components/shared/RawDataField';
import { Button } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { Skeleton } from '@components/shared/ui/skeleton';
import { cn } from '@components/shared/utils';
import { AccountInfo, useAccountExpandedInfo } from '@entities/account';
import { Account } from '@providers/accounts';
import React from 'react';
import { Code, Info } from 'react-feather';

import { DetailRow, FlatContext } from './AccountExpandedLayout';
import { ParsedSection } from './AccountExpandedSections';
import { CONTENT_COL_SPAN, DESKTOP_GRID_TEMPLATE, GRID_GAP_X, MOBILE_GRID_TEMPLATE } from './accountsTableGrid';

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
                    <Button variant="ghost" className="h-auto !items-baseline !p-0 !text-sm">
                        <Code size={11} />
                        <span>{accountInfo.size.toLocaleString('en-US')} byte(s)</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="mx-4 w-auto !rounded-lg border-none p-0" align="end">
                    <RawDataField data={accountInfo.data} filename={address} loading={accountInfoLoading} />
                </PopoverContent>
            </Popover>
        ) : (
            <span>{(data.space ?? 0).toLocaleString('en-US')} byte(s)</span>
        );

    return (
        <div
            className={cn(
                'pt-1',
                flat
                    ? 'pb-2.5'
                    : cn('grid items-start px-3 pb-8', GRID_GAP_X, MOBILE_GRID_TEMPLATE, DESKTOP_GRID_TEMPLATE),
            )}
        >
            {!flat && <div />}
            <div className={cn(!flat && CONTENT_COL_SPAN)}>
                <div className="flex flex-col gap-1.5">
                    {data.data.parsed && <ParsedSection parsed={data.data.parsed} />}
                    <DetailRow label="Assigned Program Id">
                        <Address pubkey={data.owner} link />
                    </DetailRow>
                    <DetailRow label="Allocated Data Size">{dataSizeCell}</DetailRow>
                    <DetailRow label="Executable">{data.executable ? 'Yes' : 'No'}</DetailRow>
                    <DetailRow label="Balance">
                        <SolBalance lamports={data.lamports} />
                    </DetailRow>
                </div>

                <div
                    className={cn(
                        'mt-4 flex items-center gap-1.5 text-xs text-outer-space-300',
                        flat && '!items-start px-4',
                    )}
                >
                    <Info size={16} className="shrink-0" />
                    <span>Current account data. This data may have been different at the time of the transaction.</span>
                </div>
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
            <div
                className={cn(
                    'pt-1',
                    flat
                        ? 'pb-2.5'
                        : cn('grid items-start px-3 pb-8', GRID_GAP_X, MOBILE_GRID_TEMPLATE, DESKTOP_GRID_TEMPLATE),
                )}
            >
                {!flat && <div />}
                <div className={cn(!flat && CONTENT_COL_SPAN)}>
                    <div className="flex flex-col gap-1.5">
                        {[120, 160, 100, 80].map((w, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'grid grid-cols-[clamp(100px,25%,200px)_1fr] items-baseline gap-2 py-0.5',
                                    flat && 'px-4',
                                )}
                            >
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4" style={{ width: w }} />
                            </div>
                        ))}
                    </div>
                    <div className={cn('mt-4 flex items-center gap-1.5 py-0.5', flat && '!items-start px-4')}>
                        <Skeleton className="h-3" style={{ width: 460 }} />
                    </div>
                </div>
            </div>
        );
    }

    if (enabled && isError) {
        return (
            <div
                className={cn(
                    'py-3 text-sm text-outer-space-300',
                    flat
                        ? 'px-4'
                        : cn('grid items-start px-3', GRID_GAP_X, MOBILE_GRID_TEMPLATE, DESKTOP_GRID_TEMPLATE),
                )}
            >
                {!flat && <div />}
                <div className={cn(!flat && CONTENT_COL_SPAN)}>Failed to load account info</div>
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
