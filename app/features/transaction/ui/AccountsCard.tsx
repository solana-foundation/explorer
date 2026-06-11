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
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import type { ParsedMessage, ParsedMessageAccount } from '@solana/web3.js';
import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';

import { AccountBadges } from './AccountBadges';
import { AccountDetailSlideover } from './AccountDetailSlideover';
import { AccountExpandedContent } from './AccountExpandedContent';
import { CollapsibleSection } from './CollapsibleSection';

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
    const { isLg } = useBreakpoint();

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
        if (isLg) {
            setExpanded(v => !v);
        } else {
            setSlideoverOpen(true);
        }
    };

    return (
        <>
            <div className="e-border-1 e-border-b e-border-white/10 [border-bottom-style:solid] last:e-border-b-0">
                {/* Main row */}
                <div
                    className={cn(
                        'e-min-h-9 e-px-3 e-py-2.5 md:e-px-4',
                        'e-grid e-items-start e-gap-x-0 e-gap-y-0.5 e-whitespace-nowrap e-text-sm md:e-gap-y-0 lg:e-gap-x-5',
                        'e-grid-cols-[minmax(auto,1.75rem)_minmax(100px,auto)_1fr] sm:e-grid-cols-[minmax(auto,1.75rem)_1fr_auto] lg:e-grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,180px)_1.5rem]',
                        "[grid-template-areas:'number_address_delta'_'number_address_balance'_'number_address_size'] lg:[grid-template-areas:'number_address_delta_balance_expand']",
                        'e-cursor-pointer',
                    )}
                    onClick={handleRowClick}
                >
                    <div className="e-mr-2 e-text-outer-space-300 [grid-area:number] lg:e-mr-0">{index + 1}</div>
                    <div className="[grid-area:address]">
                        <div className="e-flex e-items-center e-justify-between e-gap-1 lg:e-justify-normal">
                            <Address
                                pubkey={pubkey}
                                link
                                fetchTokenLabelInfo
                                noNicknameEditing={!isLg}
                                noCopy={!isLg}
                            />
                        </div>
                        {hasBadges && (
                            <span className="e-mt-1 e-inline-flex e-flex-wrap e-gap-1">
                                <AccountBadges index={index} message={message} pubkey={pubkey} account={account} />
                            </span>
                        )}
                    </div>
                    <div className="e-justify-self-end [grid-area:delta]">
                        <BalanceDelta delta={delta} isSol />
                    </div>
                    <div className="e-justify-self-end [grid-area:balance]">
                        <SolBalance lamports={post} />
                    </div>

                    {/* Desktop: expand button */}
                    <div className="e-hidden e-items-center e-justify-center [grid-area:expand] lg:e-flex">
                        <Button
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse account details' : 'Expand account details'}
                            className="-e-mt-1 e-h-6 e-w-6"
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
                                    'e-text-outer-space-300 e-transition-transform e-duration-200 e-ease-in-out [transform:rotate(90deg)]',
                                    expanded && '[transform:rotate(0deg)]',
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Desktop: animated expanded content */}
                <div
                    className={cn(
                        'e-hidden lg:e-grid',
                        'e-transition-[grid-template-rows] e-duration-200 e-ease-in-out',
                        expanded ? 'e-grid-rows-[1fr]' : 'e-grid-rows-[0fr]',
                    )}
                >
                    <div className="e-overflow-hidden">
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

    const totalAccountSize = useMemo(
        () => Array.from(accounts.values()).reduce((acc, account) => acc + account.size, 0),
        [accounts],
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
                    'hidden px-3 py-1.5 md:px-4 lg:grid',
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
            {!loading && totalAccountSize > 0 && (
                <div className="ml-7 flex items-baseline gap-2 px-3 py-2 text-sm text-outer-space-300 md:px-4 lg:ml-10">
                    <div className="flex flex-col">
                        <span className="text-sm uppercase leading-none">Total Account Size:</span>
                        <span className="text-[10px] leading-none">reflects current state</span>
                    </div>
                    <span className="text-white">{totalAccountSize.toLocaleString('en-US')} bytes</span>
                </div>
            )}
        </CollapsibleSection>
    );
}
