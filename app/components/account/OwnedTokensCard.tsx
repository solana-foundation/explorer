'use client';
import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { cn } from '@components/shared/utils';
import { deriveScaledUiAmountMultiplier, useTokenInfo } from '@entities/token-info';
import { TokenInfoWithPubkey, useAccountOwnedTokens, useFetchAccountOwnedTokens } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from '@/app/components/shared/ui/dropdown';
import { ProxiedImage } from '@/app/features/metadata';
import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

type Display = 'summary' | 'detail' | null;

// Holdings paginate independently of Token History (which stays at 4/4 in @/app/features/token-history/config).
// A single local declaration next to the only consumer - no shared feature module exists for holdings.
const HOLDINGS_INITIAL_VISIBLE_COUNT = 20;
const HOLDINGS_LOAD_MORE_COUNT = 20;

const useQueryDisplay = (): Display => {
    const searchParams = useSearchParams();
    const filter = searchParams?.get('display');
    if (filter === 'summary' || filter === 'detail') {
        return filter;
    } else {
        return null;
    }
};

export function OwnedTokensCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const ownedTokens = useAccountOwnedTokens(address);
    const fetchAccountTokens = useFetchAccountOwnedTokens();
    const refresh = () => fetchAccountTokens(pubkey);
    const [visibleCount, setVisibleCount] = React.useState(HOLDINGS_INITIAL_VISIBLE_COUNT);
    const display = useQueryDisplay();

    // Fetch owned tokens
    React.useEffect(() => {
        if (!ownedTokens) refresh();
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    if (ownedTokens === undefined) {
        return null;
    }

    const { status } = ownedTokens;
    const tokens = ownedTokens.data?.tokens;
    const fetching = status === FetchStatus.Fetching;
    if (fetching && (tokens === undefined || tokens.length === 0)) {
        return <LoadingCard message="Loading token holdings" />;
    } else if (tokens === undefined) {
        return <ErrorCard retry={refresh} text="Failed to fetch token holdings" />;
    }

    if (tokens.length === 0) {
        return <ErrorCard retry={refresh} retryText="Try Again" text={'No token holdings found'} />;
    }

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Token Holdings
                </CardTitle>
                <DisplayDropdown display={display} />
            </CardHeader>

            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="w-px p-0 text-center text-dk-gray-700">
                            Logo
                        </BaseTable.HeaderCell>
                        {display === 'detail' && (
                            <BaseTable.HeaderCell className="text-dk-gray-700">Account Address</BaseTable.HeaderCell>
                        )}
                        <BaseTable.HeaderCell className="text-dk-gray-700">Mint Address</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">
                            {display === 'detail' ? 'Total Balance' : 'Balance'}
                        </BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                {display === 'detail' ? (
                    <HoldingsDetail tokens={tokens} visibleCount={visibleCount} />
                ) : (
                    <HoldingsSummary tokens={tokens} visibleCount={visibleCount} />
                )}
            </BaseTable>
            <TokensCardFooter
                tokens={tokens}
                visibleCount={visibleCount}
                loadMore={() => setVisibleCount(c => c + HOLDINGS_LOAD_MORE_COUNT)}
            />
        </Card>
    );
}

type MappedToken = {
    amount: string;
    decimals: number;
    pubkey?: string;
    rawAmount: string;
    scaledUiAmountMultiplier: string;
};

function HoldingsDetail({ tokens, visibleCount }: { tokens: TokenInfoWithPubkey[]; visibleCount: number }) {
    const mappedTokens = useMemo(() => {
        const tokensMap = new Map<string, MappedToken>();

        tokens.forEach(({ info: token, pubkey }) => {
            const mintAddress = token.mint.toBase58();
            const existingToken = tokensMap.get(mintAddress);

            const decimals = token.tokenAmount.decimals;
            let amount = token.tokenAmount.uiAmountString;
            // Accumulated alongside `amount` so the tooltip's pre-scaling value matches the total the row renders.
            let rawAmount = token.tokenAmount.amount;

            if (existingToken) {
                amount = new BigNumber(existingToken.amount).plus(token.tokenAmount.uiAmountString).toString();
                rawAmount = new BigNumber(existingToken.rawAmount).plus(token.tokenAmount.amount).toString();
            }

            tokensMap.set(mintAddress, {
                amount,
                decimals,
                pubkey: pubkey.toBase58(),
                rawAmount,
                // Multiplier is a per-mint ratio, so one account's raw/ui pair is enough to derive it.
                scaledUiAmountMultiplier: deriveScaledUiAmountMultiplier(
                    token.tokenAmount.amount,
                    decimals,
                    token.tokenAmount.uiAmountString,
                ),
            });
        });

        return tokensMap;
    }, [tokens]);

    const visibleTokens = Array.from(mappedTokens.entries()).slice(0, visibleCount);

    return (
        <tbody>
            {visibleTokens.map(([mintAddress, token]) => (
                <TokenRow key={mintAddress} mintAddress={mintAddress} token={token} showAccountAddress={true} />
            ))}
        </tbody>
    );
}

function HoldingsSummary({ tokens, visibleCount }: { tokens: TokenInfoWithPubkey[]; visibleCount: number }) {
    const mappedTokens = useMemo(() => {
        const tokensMap = new Map<string, MappedToken>();
        for (const { info: token } of tokens) {
            const mintAddress = token.mint.toBase58();
            const existingToken = tokensMap.get(mintAddress);

            let amount = token.tokenAmount.uiAmountString;
            // Accumulated alongside `amount` so the tooltip's pre-scaling value matches the total the row renders.
            let rawAmount = token.tokenAmount.amount;
            if (existingToken) {
                amount = new BigNumber(existingToken.amount).plus(token.tokenAmount.uiAmountString).toString();
                rawAmount = new BigNumber(existingToken.rawAmount).plus(token.tokenAmount.amount).toString();
            }

            tokensMap.set(mintAddress, {
                amount,
                decimals: token.tokenAmount.decimals,
                rawAmount,
                // Multiplier is a per-mint ratio, so one account's raw/ui pair is enough to derive it.
                scaledUiAmountMultiplier: deriveScaledUiAmountMultiplier(
                    token.tokenAmount.amount,
                    token.tokenAmount.decimals,
                    token.tokenAmount.uiAmountString,
                ),
            });
        }
        return tokensMap;
    }, [tokens]);

    // The Map build is memoized on `tokens`; only this materialize-and-slice runs per render, O(unique mints).
    // Negligible even at a few thousand mints. If a profile ever flags it, iterate the Map and break at visibleCount.
    const visibleTokens = Array.from(mappedTokens.entries()).slice(0, visibleCount);

    return (
        <tbody>
            {visibleTokens.map(([mintAddress, token]) => (
                <TokenRow key={mintAddress} mintAddress={mintAddress} token={token} showAccountAddress={false} />
            ))}
        </tbody>
    );
}

type TokenRowProps = {
    mintAddress: string;
    token: MappedToken;
    showAccountAddress: boolean;
};

function TokenRow({ mintAddress, token, showAccountAddress }: TokenRowProps) {
    const { cluster, genesisHash } = useCluster();
    // Each visible row fetches its mint metadata once via useTokenInfo (coalesced into the app-wide
    // batched POST) and feeds it to the mint Address as tokenLabelInfo - no second fetch.
    const tokenInfo = useTokenInfo(true, mintAddress, cluster, genesisHash);

    return (
        <tr>
            <td className="w-px p-0 text-center">
                <ProxiedImage
                    alt="Token icon"
                    className="h-6 w-6 rounded-full border-4 border-solid border-dk-gray-700-dark"
                    height={16}
                    uri={tokenInfo?.logoURI ?? undefined}
                    width={16}
                />
            </td>
            {showAccountAddress && token.pubkey && (
                <td>
                    <Address pubkey={new PublicKey(token.pubkey)} link />
                </td>
            )}
            <td>
                <Address pubkey={new PublicKey(mintAddress)} link tokenLabelInfo={tokenInfo} />
            </td>
            <td>
                {token.amount} {tokenInfo?.symbol}
                <ScaledUiAmountMultiplierTooltip
                    rawAmount={new BigNumber(token.rawAmount).shiftedBy(-(token.decimals || 0)).toString()}
                    scaledUiAmountMultiplier={token.scaledUiAmountMultiplier}
                />
            </td>
        </tr>
    );
}

function TokensCardFooter({
    tokens,
    visibleCount,
    loadMore,
}: {
    tokens: TokenInfoWithPubkey[];
    visibleCount: number;
    loadMore: () => void;
}) {
    // Count unique mints to get actual token count (not account count)
    const totalCount = useMemo(() => {
        const uniqueMints = new Set(tokens.map(t => t.info.mint.toBase58()));
        return uniqueMints.size;
    }, [tokens]);

    if (visibleCount >= totalCount) {
        return null;
    }

    return (
        <CardFooter ui="dashkit">
            <Button ui="dashkit" variant="primary" className="w-full" onClick={loadMore}>
                Load More ({visibleCount} of {totalCount})
            </Button>
        </CardFooter>
    );
}

type DropdownProps = {
    display: Display;
};

const DisplayDropdown = ({ display }: DropdownProps) => {
    const currentSearchParams = useSearchParams();
    const currentPath = usePathname();
    const buildLocation = useCallback(
        (display: Display) => {
            const params = new URLSearchParams(currentSearchParams?.toString());
            if (display === null) {
                params.delete('display');
            } else {
                params.set('display', display);
            }
            const nextQueryString = params.toString();
            return `${currentPath}${nextQueryString ? `?${nextQueryString}` : ''}`;
        },
        [currentPath, currentSearchParams],
    );

    const DISPLAY_OPTIONS: Display[] = [null, 'detail'];
    return (
        <Dropdown>
            <DropdownToggle asChild>
                <Button ui="dashkit" variant="white" size="sm" type="button">
                    {display === 'detail' ? 'Detailed' : 'Summary'} <ChevronDown size={15} className="align-text-top" />
                </Button>
            </DropdownToggle>
            <DropdownMenu align="end">
                {DISPLAY_OPTIONS.map(displayOption => {
                    return (
                        <DropdownItem
                            asChild
                            key={displayOption || 'null'}
                            className={cn(displayOption === display && 'active')}
                        >
                            <Link href={buildLocation(displayOption)}>
                                {displayOption === 'detail' ? 'Detailed' : 'Summary'}
                            </Link>
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
};
