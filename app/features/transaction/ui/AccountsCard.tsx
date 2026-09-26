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
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'react-feather';

import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { DataListCard, DataListRow } from '@/app/shared/ui/DataListCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

import { getStaticAccountKeysSize } from './account-keys-size';
import { AccountBadges } from './AccountBadges';
import { AccountDetailDrawer } from './AccountDetailDrawer';
import { AccountExpandedContent } from './AccountExpandedContent';

type TransactionAccountRowProps = {
    account: ParsedMessageAccount;
    accountInfo?: AccountInfo;
    accountInfoLoading: boolean;
    index: number;
    isDesktop: boolean;
    message: ParsedMessage;
    post: number;
    pre: number;
};

function TransactionAccountRow({
    account,
    accountInfo,
    accountInfoLoading,
    index,
    isDesktop,
    message,
    post,
    pre,
}: TransactionAccountRowProps) {
    const [expanded, setExpanded] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Mount the mobile drawer only once the row is first tapped — otherwise every account row mounts a
    // closed drawer up front.
    const [drawerMounted, setDrawerMounted] = useState(false);

    // If the viewport crosses to desktop while the drawer is open, close it gracefully (Radix runs its
    // exit animation + scroll-lock/focus teardown) instead of the render gate unmounting it abruptly.
    useEffect(() => {
        if (isDesktop) setDrawerOpen(false);
    }, [isDesktop]);

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
            setDrawerMounted(true);
            setDrawerOpen(true);
        }
    };

    return (
        <>
            <DataListRow>
                <div
                    className={cn('flex min-h-9 cursor-pointer items-start gap-3 text-sm', ROW_PADDING)}
                    onClick={handleRowClick}
                >
                    <div className="shrink-0 text-outer-space-300">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                        <div className="min-w-0" onClick={e => isDesktop && e.stopPropagation()}>
                            <Address
                                className={!isDesktop ? 'text-[#33a382]' : ''}
                                pubkey={pubkey}
                                link={isDesktop}
                                fetchTokenLabelInfo
                                noNicknameEditing={!isDesktop}
                                noCopy={!isDesktop}
                            />
                        </div>
                        {hasBadges && (
                            <span className="mb-0.5 mt-1 inline-flex flex-wrap gap-1">
                                <AccountBadges index={index} message={message} pubkey={pubkey} account={account} />
                            </span>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap text-right">
                        <BalanceDelta delta={delta} isSol />
                        <SolBalance lamports={post} />
                    </div>

                    <div className="hidden shrink-0 items-center lg:flex landscape:flex">
                        <Button
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse account details' : 'Expand account details'}
                            className="!h-5 !w-5 [&_svg]:size-4"
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
                                    expanded ? 'rotate-180' : 'rotate-0',
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Desktop-only animated reveal; the shared flat layout stacks the KeyValue detail rows. */}
                <div
                    className={cn(
                        'hidden lg:grid landscape:grid',
                        'transition-[grid-template-rows,opacity] duration-200 ease-in-out',
                        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0 overflow-hidden">
                        <AccountExpandedContent
                            flat
                            accountInfo={accountInfo}
                            accountInfoLoading={accountInfoLoading}
                            address={key}
                            enabled={expanded}
                        />
                    </div>
                </div>
            </DataListRow>

            {drawerMounted && (
                <AccountDetailDrawer
                    account={account}
                    accountInfo={accountInfo}
                    accountInfoLoading={accountInfoLoading}
                    index={index}
                    message={message}
                    onOpenChange={setDrawerOpen}
                    open={drawerOpen}
                />
            )}
        </>
    );
}

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    // One breakpoint subscription for the whole card — rows read `isDesktop` as a prop instead of each
    // registering its own matchMedia listeners.
    const { isLandscape, isLg } = useBreakpoint();
    const isDesktop = isLg || isLandscape;

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    const pubkeys = useMemo(() => message?.accountKeys.map(a => a.pubkey) ?? [], [message?.accountKeys]);

    const { accounts, error, loading } = useAccountsInfo(pubkeys, url);

    // The summed on-chain data sizes have no bearing on the transaction itself, so the
    // footer reports the static account-keys footprint instead (32 bytes per key,
    // lookup-table addresses excluded) for sizing against the transaction size limit.
    const { accountCount, sizeBytes: totalAccountsSize } = useMemo(
        () => getStaticAccountKeysSize(message?.accountKeys ?? []),
        [message?.accountKeys],
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
                isDesktop={isDesktop}
                message={message}
                post={meta.postBalances[index]}
                pre={meta.preBalances[index]}
            />
        );
    });

    const footer = !loading && totalAccountsSize > 0 && (
        <div className={cn('text-sm text-outer-space-300', ROW_PADDING)}>
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span>Total Accounts Size:</span>
                    <span className="text-white">{totalAccountsSize.toLocaleString('en-US')} bytes</span>
                </div>
                <span className="text-xs">
                    {accountCount.toLocaleString('en-US')} static account keys × 32 bytes, excluding address lookup
                    table addresses. Compare against the 1232-byte transaction size limit.
                </span>
            </div>
        </div>
    );

    return (
        <DataListCard id="accounts" title="Accounts &amp; SOL balance" className="mb-6" footer={footer}>
            {accountRows}
        </DataListCard>
    );
}
