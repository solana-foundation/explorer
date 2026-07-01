'use client';

import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { AccountInfo, useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import type { ParsedMessage, ParsedMessageAccount } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';

import { AccountBadges } from './AccountBadges';
import { AccountDetailSlideover } from './AccountDetailSlideover';
import { AccountExpandedContent } from './AccountExpandedContent';
import { CollapsibleSection } from './CollapsibleSection';

const ACCOUNT_KEY_SIZE_BYTES = 32;

export function getTransactionAccountKeysSizeBytes(accountKeys: Array<{ source?: string }>) {
    return accountKeys.filter(account => account.source !== 'lookupTable').length * ACCOUNT_KEY_SIZE_BYTES;
}

type TransactionAccountRowProps = {
    account: ParsedMessageAccount;
    accountInfo?: AccountInfo;
    accountInfoLoading: boolean;
    index: number;
    message: ParsedMessage;
    post: number;
    pre: number;
};

function TransactionAccountRow({
    account,
    accountInfo,
    accountInfoLoading,
    index,
    message,
    post,
    pre,
}: TransactionAccountRowProps) {
    const [expanded, setExpanded] = useState(false);
    const [slideoverOpen, setSlideoverOpen] = useState(false);
    const { isLandscape, isLg } = useBreakpoint();
    const isDesktop = isLg || isLandscape;

    const pubkey = account.pubkey;
    const key = pubkey.toBase58();
    const delta = new BigNumber(post).minus(new BigNumber(pre));

    const hasBadges =
        index === 0 ||
        account.signer ||
        account.writable ||
        message.instructions.some(ix => ix.programId.equals(pubkey)) ||
        account.source === 'lookupTable';

    const handleRowClick = () => {
        if (isDesktop) {
            setExpanded(v => !v);
        } else {
            setSlideoverOpen(true);
        }
    };

    return (
        <>
            <div className="border-1 border-b border-white/10 [border-bottom-style:solid] last:border-b-0">
                {/* Main row */}
                <div
                    className={cn(
                        'min-h-9 px-3 py-2.5 md:px-4',
                        'grid items-start gap-x-0 gap-y-0.5 whitespace-nowrap text-sm md:gap-y-0 lg:gap-x-5 landscape:gap-x-5',
                        'grid-cols-[minmax(auto,1.75rem)_minmax(100px,auto)_1fr] sm:grid-cols-[minmax(auto,1.75rem)_1fr_auto] lg:grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_1.5rem] landscape:grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_1.5rem]',
                        "[grid-template-areas:'number_address_delta'_'number_address_balance'_'number_address_size'] lg:[grid-template-areas:'number_address_delta_balance_expand'] landscape:[grid-template-areas:'number_address_delta_balance_expand']",
                        'cursor-pointer',
                    )}
                    onClick={handleRowClick}
                >
                    <div className="mr-2 text-outer-space-300 [grid-area:number] lg:mr-0">{index + 1}</div>
                    <div className="[grid-area:address]">
                        <div className="flex items-center justify-between gap-1 lg:justify-normal landscape:justify-normal">
                            <div className="min-w-0 flex-1" onClick={e => isDesktop && e.stopPropagation()}>
                                <Address
                                    className={!isDesktop ? 'text-[#33a382]' : ''}
                                    pubkey={pubkey}
                                    link={isDesktop}
                                    fetchTokenLabelInfo
                                    noNicknameEditing={!isDesktop}
                                    noCopy={!isDesktop}
                                />
                            </div>
                        </div>
                        {hasBadges && (
                            <span className="mt-1 inline-flex flex-wrap gap-1">
                                <AccountBadges index={index} message={message} pubkey={pubkey} account={account} />
                            </span>
                        )}
                    </div>
                    <div className="justify-self-end [grid-area:delta]">
                        <BalanceDelta delta={delta} isSol />
                    </div>
                    <div className="justify-self-end [grid-area:balance]">
                        <SolBalance lamports={post} />
                    </div>

                    {/* Desktop: expand button */}
                    <div className="hidden items-center justify-center [grid-area:expand] lg:flex landscape:flex">
                        <Button
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse account details' : 'Expand account details'}
                            className="!h-5 w-6"
                            onClick={e => {
                                e.stopPropagation();
                                setExpanded(v => !v);
                            }}
                            size="icon"
                            variant="ghost"
                        >
                            <ChevronDown
                                size={16}
                                className={cn(
                                    'text-outer-space-300 transition-transform duration-200 ease-in-out',
                                    expanded ? 'rotate-0' : 'rotate-90',
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Desktop: animated expanded content */}
                <div
                    className={cn(
                        'hidden lg:grid landscape:grid',
                        'transition-[grid-template-rows,opacity] duration-200 ease-in-out',
                        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0 overflow-hidden">
                        <AccountExpandedContent
                            accountInfo={accountInfo}
                            accountInfoLoading={accountInfoLoading}
                            address={key}
                            enabled={expanded}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile: slideover */}
            <AccountDetailSlideover
                account={account}
                accountInfo={accountInfo}
                accountInfoLoading={accountInfoLoading}
                index={index}
                message={message}
                onOpenChange={setSlideoverOpen}
                open={slideoverOpen}
            />
        </>
    );
}

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();

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
        const pubkeyStr = account.pubkey.toBase58();
        return (
            <TransactionAccountRow
                key={pubkeyStr}
                account={account}
                accountInfo={accounts.get(pubkeyStr)}
                accountInfoLoading={loading}
                index={index}
                message={message}
                post={meta.postBalances[index]}
                pre={meta.preBalances[index]}
            />
        );
    });

    return (
        <CollapsibleSection id="accounts" title="Accounts &amp; SOL balance">
            <div
                className={cn(
                    'hidden px-3 py-1.5 md:px-4 lg:grid landscape:grid',
                    'grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_2rem] gap-5 text-xs uppercase text-outer-space-300',
                    'border-1 border-b border-white/10 [border-bottom-style:solid]',
                )}
            >
                <div>#</div>
                <div>Address</div>
                <div className="text-right">Change (SOL)</div>
                <div className="text-right">Post Balance (SOL)</div>
                <div />
            </div>
            {accountRows}
            {totalAccountKeysSize > 0 && (
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
