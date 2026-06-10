'use client';
import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import {
    TokenInfoWithPubkey,
    useAccountOwnedTokens,
    useFetchAccountOwnedTokens,
    useScaledUiAmountForMint,
} from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import { ProxiedImage } from '@/app/features/metadata';
import { INITIAL_VISIBLE_COUNT, LOAD_MORE_COUNT } from '@/app/features/token-history/config';
import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';
import { normalizeTokenAmount } from '@/app/utils';

type Display = 'summary' | 'detail' | null;

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
    const [showDropdown, setDropdown] = React.useState(false);
    const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT);
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

    if (tokens.length > 100) {
        return <ErrorCard text="Token holdings are not available for accounts with over 100 token accounts" />;
    }
    const showLogos = tokens.some(t => t.logoURI !== undefined);

    return (
        <>
            {showDropdown && <div className="dropdown-exit" onClick={() => setDropdown(false)} />}

            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Token Holdings
                    </CardTitle>
                    <DisplayDropdown display={display} toggle={() => setDropdown(show => !show)} show={showDropdown} />
                </CardHeader>

                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            {showLogos && (
                                <BaseTable.HeaderCell className="e-text-dk-gray-700 e-w-px e-p-0 e-text-center">
                                    Logo
                                </BaseTable.HeaderCell>
                            )}
                            {display === 'detail' && (
                                <BaseTable.HeaderCell className="e-text-dk-gray-700">Account Address</BaseTable.HeaderCell>
                            )}
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">Mint Address</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">
                                {display === 'detail' ? 'Total Balance' : 'Balance'}
                            </BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    {display === 'detail' ? (
                        <HoldingsDetail tokens={tokens} showLogos={showLogos} visibleCount={visibleCount} />
                    ) : (
                        <HoldingsSummary tokens={tokens} showLogos={showLogos} visibleCount={visibleCount} />
                    )}
                </BaseTable>
                <TokensCardFooter
                    tokens={tokens}
                    visibleCount={visibleCount}
                    loadMore={() => setVisibleCount(c => c + LOAD_MORE_COUNT)}
                />
            </Card>
        </>
    );
}

type MappedToken = {
    amount: string;
    decimals: number;
    logoURI?: string;
    name?: string;
    pubkey?: string;
    rawAmount: string;
    symbol?: string;
};

function HoldingsDetail({
    tokens,
    showLogos,
    visibleCount,
}: {
    tokens: TokenInfoWithPubkey[];
    showLogos: boolean;
    visibleCount: number;
}) {
    const mappedTokens = useMemo(() => {
        const tokensMap = new Map<string, MappedToken>();

        tokens.forEach(({ info: token, logoURI, pubkey, symbol, name }) => {
            const mintAddress = token.mint.toBase58();
            const existingToken = tokensMap.get(mintAddress);

            const rawAmount = token.tokenAmount.amount;
            const decimals = token.tokenAmount.decimals;
            let amount = token.tokenAmount.uiAmountString;

            if (existingToken) {
                amount = new BigNumber(existingToken.amount).plus(token.tokenAmount.uiAmountString).toString();
            }

            tokensMap.set(mintAddress, {
                amount,
                decimals,
                logoURI,
                name,
                pubkey: pubkey.toBase58(),
                rawAmount,
                symbol,
            });
        });

        return tokensMap;
    }, [tokens]);

    const visibleTokens = Array.from(mappedTokens.entries()).slice(0, visibleCount);

    return (
        <tbody>
            {visibleTokens.map(([mintAddress, token]) => (
                <TokenRow
                    key={mintAddress}
                    mintAddress={mintAddress}
                    token={token}
                    showLogo={showLogos}
                    showAccountAddress={true}
                />
            ))}
        </tbody>
    );
}

function HoldingsSummary({
    tokens,
    showLogos,
    visibleCount,
}: {
    tokens: TokenInfoWithPubkey[];
    showLogos: boolean;
    visibleCount: number;
}) {
    const mappedTokens = useMemo(() => {
        const tokensMap = new Map<string, MappedToken>();
        for (const { info: token, logoURI, symbol, name } of tokens) {
            const mintAddress = token.mint.toBase58();
            const totalByMint = tokensMap.get(mintAddress)?.amount;

            let amount = token.tokenAmount.uiAmountString;
            if (totalByMint !== undefined) {
                amount = new BigNumber(totalByMint).plus(token.tokenAmount.uiAmountString).toString();
            }

            tokensMap.set(mintAddress, {
                amount,
                decimals: token.tokenAmount.decimals,
                logoURI,
                name,
                rawAmount: token.tokenAmount.amount,
                symbol,
            });
        }
        return tokensMap;
    }, [tokens]);

    const visibleTokens = Array.from(mappedTokens.entries()).slice(0, visibleCount);

    return (
        <tbody>
            {visibleTokens.map(([mintAddress, token]) => (
                <TokenRow
                    key={mintAddress}
                    mintAddress={mintAddress}
                    token={token}
                    showLogo={showLogos}
                    showAccountAddress={false}
                />
            ))}
        </tbody>
    );
}

type TokenRowProps = {
    mintAddress: string;
    token: MappedToken;
    showLogo: boolean;
    showAccountAddress: boolean;
};

function TokenRow({ mintAddress, token, showLogo, showAccountAddress }: TokenRowProps) {
    const [_, scaledUiAmountMultiplier] = useScaledUiAmountForMint(mintAddress, token.rawAmount);

    return (
        <tr>
            {showLogo && (
                <td className="e-w-px e-p-0 e-text-center">
                    <ProxiedImage
                        alt="Token icon"
                        className="e-h-6 e-w-6 e-rounded-full e-border-4 e-border-solid e-border-dk-gray-700-dark"
                        height={16}
                        uri={token.logoURI}
                        width={16}
                    />
                </td>
            )}
            {showAccountAddress && token.pubkey && (
                <td>
                    <Address pubkey={new PublicKey(token.pubkey)} link />
                </td>
            )}
            <td>
                <Address pubkey={new PublicKey(mintAddress)} link tokenLabelInfo={token} />
            </td>
            <td>
                {token.amount} {token.symbol}
                <ScaledUiAmountMultiplierTooltip
                    rawAmount={normalizeTokenAmount(Number(token.rawAmount), token.decimals || 0).toString()}
                    scaledUiAmountMultiplier={scaledUiAmountMultiplier}
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
            <button className="btn btn-primary e-w-full" onClick={loadMore}>
                Load More ({visibleCount} of {totalCount})
            </button>
        </CardFooter>
    );
}

type DropdownProps = {
    display: Display;
    toggle: () => void;
    show: boolean;
};

const DisplayDropdown = ({ display, toggle, show }: DropdownProps) => {
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
        <div className="dropdown">
            <button className="btn btn-white btn-sm" type="button" onClick={toggle}>
                {display === 'detail' ? 'Detailed' : 'Summary'} <ChevronDown size={15} className="e-align-text-top" />
            </button>
            <div className={cn('dropdown-menu-end dropdown-menu', show && 'show')}>
                {DISPLAY_OPTIONS.map(displayOption => {
                    return (
                        <Link
                            key={displayOption || 'null'}
                            href={buildLocation(displayOption)}
                            className={cn('dropdown-item', displayOption === display && 'active')}
                            onClick={toggle}
                        >
                            {displayOption === 'detail' ? 'Detailed' : 'Summary'}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
