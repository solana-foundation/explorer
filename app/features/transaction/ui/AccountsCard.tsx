import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { RawDataField } from '@components/shared/RawDataField';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@components/shared/ui/popover';
import { cn } from '@components/shared/utils';
import { useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { Code } from 'react-feather';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';

import { CollapsibleSection } from './CollapsibleSection';

const ACCOUNT_KEY_SIZE_BYTES = 32;

export function getTransactionAccountKeysSizeBytes(accountKeys: Array<{ source?: string }>) {
    return accountKeys.filter(account => account.source !== 'lookupTable').length * ACCOUNT_KEY_SIZE_BYTES;
}

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    const { isLg } = useBreakpoint();

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    const pubkeys = useMemo(() => message?.accountKeys.map(a => a.pubkey) ?? [], [message?.accountKeys]);

    const { accounts, error, loading } = useAccountsInfo(pubkeys, url);

    const totalAccountKeysSize = useMemo(
        () => getTransactionAccountKeysSizeBytes(message?.accountKeys ?? []),
        [message],
    );

    if (!transactionWithMeta) {
        return null;
    }

    if (!meta || !message) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    if (error) {
        return <ErrorCard text="Failed to fetch accounts info" />;
    }

    const accountRows = message.accountKeys.map((account, index) => {
        const pre = meta.preBalances[index];
        const post = meta.postBalances[index];
        const pubkey = account.pubkey;
        const key = pubkey.toBase58();
        const delta = new BigNumber(post).minus(new BigNumber(pre));
        const accountInfo = accounts.get(key);

        const hasBadges =
            index === 0 ||
            account.signer ||
            account.writable ||
            message.instructions.some(ix => ix.programId.equals(pubkey)) ||
            account.source === 'lookupTable';

        const badges = (
            <>
                {index === 0 && (
                    <Badge ui="dashkit" variant="success" className="me-1">
                        Fee Payer
                    </Badge>
                )}
                {account.signer && (
                    <Badge ui="dashkit" variant="info" className="me-1">
                        Signer
                    </Badge>
                )}
                {account.writable && (
                    <Badge ui="dashkit" variant="danger" className="me-1">
                        Writable
                    </Badge>
                )}
                {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
                    <Badge ui="dashkit" variant="warning" className="me-1">
                        Program
                    </Badge>
                )}
                {account.source === 'lookupTable' && (
                    <Badge ui="dashkit" variant="gray" className="me-1">
                        Address Table Lookup
                    </Badge>
                )}
            </>
        );

        const dataCell = loading ? (
            <span className="text-xs text-outer-space-300">Loading…</span>
        ) : accountInfo && accountInfo.size > 0 ? (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-auto !px-1 !py-0 text-xs">
                        <Code size={11} />
                        <span>{accountInfo.size.toLocaleString('en-US')}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="mx-4 w-auto !rounded-lg border-none p-0" align="end">
                    <RawDataField data={accountInfo.data} filename={key} />
                </PopoverContent>
            </Popover>
        ) : null;

        return (
            <div
                key={key}
                className={cn(
                    'min-h-9 px-3 py-2.5 md:px-4',
                    'grid items-start gap-x-0 gap-y-0.5 whitespace-nowrap text-sm md:gap-y-0 lg:gap-x-5',
                    'grid-cols-[minmax(auto,1.75rem)_minmax(100px,auto)_1fr] sm:grid-cols-[minmax(auto,1.75rem)_1fr_auto] lg:grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)]',
                    "[grid-template-areas:'number_address_delta'_'number_address_balance'_'number_address_size'] lg:[grid-template-areas:'number_address_delta_balance']",
                    'border-1 border-b border-white/10 [border-bottom-style:solid] last:border-b-0',
                )}
            >
                <div className="mr-2 text-outer-space-300 [grid-area:number] lg:mr-0">{index + 1}</div>
                <div className="[grid-area:address]">
                    <div className="flex items-center justify-between gap-1 lg:justify-normal">
                        <Address pubkey={pubkey} link fetchTokenLabelInfo />
                    </div>
                    {hasBadges && (
                        <span className="mt-1 inline-flex flex-wrap gap-1">
                            {badges}
                            {isLg && dataCell}
                        </span>
                    )}
                </div>
                <div className="justify-self-end [grid-area:delta]">
                    <BalanceDelta delta={delta} isSol />
                </div>
                <div className="justify-self-end [grid-area:balance]">
                    <SolBalance lamports={post} />
                </div>
                {!isLg && <div className="justify-self-end [grid-area:size]">{dataCell}</div>}
            </div>
        );
    });

    return (
        <CollapsibleSection id="accounts" title="Accounts &amp; SOL balance">
            <div
                className={cn(
                    'hidden px-3 py-1.5 md:px-4 lg:grid',
                    'grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)] gap-5 text-xs uppercase text-outer-space-300',
                    'border-1 border-b border-white/10 [border-bottom-style:solid]',
                )}
            >
                <div>#</div>
                <div>Address</div>
                <div className="text-right">Change (SOL)</div>
                <div className="text-right">Post Balance (SOL)</div>
            </div>
            {accountRows}
            {!loading && totalAccountKeysSize > 0 && (
                <div className="ml-7 flex items-baseline gap-2 px-3 py-2 text-sm text-outer-space-300 md:px-4 lg:ml-10">
                    <div className="flex flex-col">
                        <span className="text-sm uppercase leading-none">Total Account Keys Size:</span>
                        <span className="text-[10px] leading-none">excludes address lookup tables</span>
                    </div>
                    <span className="text-white">{totalAccountKeysSize.toLocaleString('en-US')} bytes</span>
                </div>
            )}
        </CollapsibleSection>
    );
}
