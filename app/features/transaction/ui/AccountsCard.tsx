'use client';

import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { Button } from '@components/shared/ui/button';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import { cn } from '@components/shared/utils';
import { useAccountSizes } from '@entities/account';
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
import {
    CELL_PADDING,
    CONTENT_COL_SPAN,
    DESKTOP_GRID_TEMPLATE,
    GRID_GAP_X,
    MOBILE_GRID_TEMPLATE,
} from './accountsTableGrid';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    // One subscription for the whole table: read inside the row, a long account list opens a media
    // query listener per row.
    const { isLandscape, isLg } = useBreakpoint();
    const isDesktop = isLg || isLandscape;

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    // The row key, the row itself and the sizes request all need the base58 of each account, and
    // `toBase58` re-encodes on every call, so the card mints each string once.
    const accounts = useMemo(
        () => message?.accountKeys.map(account => ({ account, address: account.pubkey.toBase58() })) ?? [],
        [message?.accountKeys],
    );
    const addresses = useMemo(() => accounts.map(({ address }) => address), [accounts]);

    // Sizes feed the footer total only, so a failed fetch drops the footer and leaves the rows
    // untouched.
    const { sizes, loading } = useAccountSizes(addresses, url);

    const totalAccountSize = useMemo(
        () => Array.from(sizes.values()).reduce((total, size) => total + size, 0),
        [sizes],
    );

    if (!transactionWithMeta) {
        return null;
    }

    if (!meta || !message) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    const accountRows = accounts.map(({ account, address }, index) => {
        return (
            <TransactionAccountRow
                key={address}
                account={account}
                address={address}
                index={index}
                isDesktop={isDesktop}
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
                    'hidden lg:grid landscape:grid',
                    CELL_PADDING,
                    DESKTOP_GRID_TEMPLATE,
                    GRID_GAP_X,
                    'text-xs uppercase text-outer-space-300',
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
                // TODO: extract these repeated grid-row containers (header + this footer) into a
                // cva-based component. cn keeps duplicate classes, so the ad-hoc composition here is
                // hard to read and risks conflicting utilities.
                <div
                    className={cn(
                        'grid items-start px-3 py-3 text-sm text-outer-space-300',
                        GRID_GAP_X,
                        MOBILE_GRID_TEMPLATE,
                        DESKTOP_GRID_TEMPLATE,
                    )}
                >
                    <div className="mr-2 text-outer-space-300 lg:mr-0" />
                    <div className={cn('flex flex-col', CONTENT_COL_SPAN)}>
                        <div className="flex items-baseline gap-2">
                            <span>Total Account Size:</span>
                            <span className="text-white">{totalAccountSize.toLocaleString('en-US')} bytes</span>
                        </div>
                        <span className="text-xs">
                            Current data. This data may have been different at the time of the transaction.
                        </span>
                    </div>
                </div>
            )}
        </CollapsibleSection>
    );
}

type TransactionAccountRowProps = {
    account: ParsedMessageAccount;
    address: string;
    index: number;
    isDesktop: boolean;
    message: ParsedMessage;
    post: number;
    pre: number;
};

// A row builds a detail region when it first opens it, so a list of accounts carries neither the
// expanded content nor a dialog for a row nobody touched. Closing keeps the region mounted, so its
// closing animation plays.
type DetailsState = 'closed' | 'open' | 'unmounted';

// The card re-renders when the account sizes arrive and on every cluster or transaction cache
// change, and a row's props hold across all three.
const TransactionAccountRow = React.memo(function TransactionAccountRow({
    account,
    address,
    index,
    isDesktop,
    message,
    post,
    pre,
}: TransactionAccountRowProps) {
    const [expandedState, setExpandedState] = useState<DetailsState>('unmounted');
    const [slideover, setSlideover] = useState<DetailsState>('unmounted');
    const expanded = expandedState === 'open';

    const pubkey = account.pubkey;
    const delta = new BigNumber(post).minus(new BigNumber(pre));

    const toggleExpanded = () => setExpandedState(state => (state === 'open' ? 'closed' : 'open'));

    const handleRowClick = () => {
        if (isDesktop) {
            toggleExpanded();
        } else {
            setSlideover('open');
        }
    };

    return (
        <>
            <div className="border-1 border-b border-white/10 [border-bottom-style:solid] last:border-b-0">
                {/* Main row */}
                <div
                    className={cn(
                        'min-h-9',
                        CELL_PADDING,
                        'grid items-start gap-y-0.5 whitespace-nowrap text-sm md:gap-y-0',
                        GRID_GAP_X,
                        MOBILE_GRID_TEMPLATE,
                        DESKTOP_GRID_TEMPLATE,
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
                        <span className="mb-0.5 mt-1 inline-flex flex-wrap gap-1 empty:hidden">
                            <AccountBadges index={index} message={message} pubkey={pubkey} account={account} />
                        </span>
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
                            className="!h-5 !w-5 [&_svg]:size-4"
                            onClick={e => {
                                e.stopPropagation();
                                toggleExpanded();
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

                {/* Desktop: animated expanded content */}
                <div
                    className={cn(
                        'hidden lg:grid landscape:grid',
                        'transition-[grid-template-rows,opacity] duration-200 ease-in-out',
                        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                >
                    <div className="min-h-0 overflow-hidden">
                        {expandedState !== 'unmounted' && (
                            <AccountExpandedContent address={address} enabled={expanded} />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: slideover */}
            {slideover !== 'unmounted' && (
                <AccountDetailSlideover
                    account={account}
                    index={index}
                    message={message}
                    onOpenChange={open => setSlideover(open ? 'open' : 'closed')}
                    open={!isDesktop && slideover === 'open'}
                />
            )}
        </>
    );
});
