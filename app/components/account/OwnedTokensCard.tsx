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
import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import { getProxiedUri } from '@/app/features/metadata/utils';
import TokenLogoPlaceholder from '@/app/img/logos-solana/low-contrast-solana-logo.svg';
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
        return <ErrorCard text="Token holdings is not available for accounts with over 100 token accounts" />;
    }
    const showLogos = tokens.some(t => t.logoURI !== undefined);

    return (
        <>
            {showDropdown && <div className="dropdown-exit" onClick={() => setDropdown(false)} />}

            <div className="card">
                <div className="card-header align-items-center">
                    <h3 className="card-header-title">Token Holdings</h3>
                    <DisplayDropdown display={display} toggle={() => setDropdown(show => !show)} show={showDropdown} />
                </div>

                <div className="table-responsive mb-0">
                    <table className="table table-sm table-nowrap card-table">
                        <thead>
                            <tr>
                                {showLogos && <th className="text-muted w-1 p-0 text-center">Logo</th>}
                                {display === 'detail' && <th className="text-muted">Account Address</th>}
                                <th className="text-muted">Mint Address</th>
                                <th className="text-muted">{display === 'detail' ? 'Total Balance' : 'Balance'}</th>
                            </tr>
                        </thead>
                        {display === 'detail' ? (
                            <HoldingsDetail tokens={tokens} showLogos={showLogos} />
                        ) : (
                            <HoldingsSummary tokens={tokens} showLogos={showLogos} />
                        )}
                    </table>
                </div>
            </div>
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

function HoldingsDetail({ tokens, showLogos }: { tokens: TokenInfoWithPubkey[]; showLogos: boolean }) {
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

    return (
        <tbody className="list">
            {Array.from(mappedTokens.entries()).map(([mintAddress, token]) => (
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

function HoldingsSummary({ tokens, showLogos }: { tokens: TokenInfoWithPubkey[]; showLogos: boolean }) {
    const mappedTokens = new Map<string, MappedToken>();
    for (const { info: token, logoURI, symbol, name } of tokens) {
        const mintAddress = token.mint.toBase58();
        const totalByMint = mappedTokens.get(mintAddress)?.amount;

        let amount = token.tokenAmount.uiAmountString;
        if (totalByMint !== undefined) {
            amount = new BigNumber(totalByMint).plus(token.tokenAmount.uiAmountString).toString();
        }

        mappedTokens.set(mintAddress, {
            amount,
            decimals: token.tokenAmount.decimals,
            logoURI,
            name,
            rawAmount: token.tokenAmount.amount,
            symbol,
        });
    }

    return (
        <tbody className="list">
            {Array.from(mappedTokens.entries()).map(([mintAddress, token]) => (
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

    const logoURI = token.logoURI ? getProxiedUri(token.logoURI) : undefined;

    return (
        <tr>
            {showLogo && (
                <td className="w-1 p-0 text-center">
                    {logoURI ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoURI}
                            alt="Token icon"
                            height={16}
                            width={16}
                            className="token-icon rounded-circle border border-4 border-gray-dark"
                        />
                    ) : (
                        <Image
                            src={TokenLogoPlaceholder}
                            alt="Token icon placeholder"
                            height={16}
                            width={16}
                            className="e-h-4 e-w-4 e-rounded-full e-object-cover"
                        />
                    )}
                </td>
            )}
            {showAccountAddress && token.pubkey && (
                <td>
                    <Address pubkey={new PublicKey(token.pubkey)} link tokenLabelInfo={token} useMetadata />
                </td>
            )}
            <td>
                <Address pubkey={new PublicKey(mintAddress)} link tokenLabelInfo={token} useMetadata />
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
        [currentPath, currentSearchParams]
    );

    const DISPLAY_OPTIONS: Display[] = [null, 'detail'];
    return (
        <div className="dropdown">
            <button className="btn btn-white btn-sm" type="button" onClick={toggle}>
                {display === 'detail' ? 'Detailed' : 'Summary'} <ChevronDown size={15} className="align-text-top" />
            </button>
            <div className={`dropdown-menu-end dropdown-menu${show ? ' show' : ''}`}>
                {DISPLAY_OPTIONS.map(displayOption => {
                    return (
                        <Link
                            key={displayOption || 'null'}
                            href={buildLocation(displayOption)}
                            className={`dropdown-item${displayOption === display ? ' active' : ''}`}
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
