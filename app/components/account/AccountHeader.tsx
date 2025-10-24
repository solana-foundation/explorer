import { CompressedNftAccountHeader } from '@components/account/CompressedNftCard';
import { MetaplexNFTHeader } from '@components/account/MetaplexNFTHeader';
import { isNFTokenAccount } from '@components/account/nftoken/isNFTokenAccount';
import { NFTokenAccountHeader } from '@components/account/nftoken/NFTokenAccountHeader';
import { Identicon } from '@components/common/Identicon';
import ProgramLogoPlaceholder from '@img/program-logo-placeholder.svg';
import {
    Account,
    isTokenProgramData,
    isUpgradeableLoaderAccountData,
    TokenProgramData,
    type UpgradeableLoaderAccountData,
    useMintAccountInfo,
} from '@providers/accounts';
import isMetaplexNFT from '@providers/accounts/utils/isMetaplexNFT';
import { useMetadataJsonLink } from '@providers/compressed-nft';
import { MintAccountInfo } from '@validators/accounts/token';
import { MetadataPointer, TokenMetadata } from '@validators/accounts/token-extension';
import Image from 'next/image';
import React, { Suspense, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { create } from 'superstruct';

import { getProxiedUri } from '@/app/features/metadata/utils';
import { isPmpSecurityTXT, useSecurityTxt } from '@/app/features/security-txt';
import { type FullTokenInfo, isRedactedTokenAddress } from '@/app/utils/token-info';

import { InfoTooltip } from '../common/InfoTooltip';

const IDENTICON_WIDTH = 64;

export function AccountHeader({
    address,
    account,
    tokenInfo,
    isTokenInfoLoading,
}: {
    address: string;
    account?: Account;
    tokenInfo?: FullTokenInfo;
    isTokenInfoLoading: boolean;
}) {
    const mintInfo = useMintAccountInfo(address);

    const parsedData = account?.data.parsed;

    const isToken = parsedData && isTokenProgramData(parsedData) && parsedData?.parsed.type === 'mint';
    const isProgram = parsedData && isUpgradeableLoaderAccountData(parsedData) && parsedData?.parsed.type === 'program';

    if (isMetaplexNFT(parsedData, mintInfo) && parsedData.nftData) {
        return <MetaplexNFTHeader nftData={parsedData.nftData} address={address} />;
    }

    const nftokenNFT = account && isNFTokenAccount(account);
    if (nftokenNFT && account) {
        return <NFTokenAccountHeader account={account} />;
    }

    if (isToken && !isTokenInfoLoading) {
        if (isRedactedTokenAddress(address)) {
            return (
                <TokenMintHeader address={address} mintInfo={mintInfo} parsedData={undefined} tokenInfo={undefined} />
            );
        }
        return <TokenMintHeader address={address} mintInfo={mintInfo} parsedData={parsedData} tokenInfo={tokenInfo} />;
    }

    if (isProgram) {
        return <ProgramHeader address={address} parsedData={parsedData} />;
    }

    const fallback = (
        <div className="e-flex e-flex-col">
            <h6 className="header-pretitle">Details</h6>
            <h2 className="header-title">Account</h2>
        </div>
    );
    if (account) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Suspense fallback={fallback}>
                    <CompressedNftAccountHeader account={account} />
                </Suspense>
            </ErrorBoundary>
        );
    }
    return fallback;
}

function TokenMintHeader({
    address,
    tokenInfo,
    mintInfo,
    parsedData,
}: {
    address: string;
    tokenInfo?: FullTokenInfo;
    mintInfo?: MintAccountInfo;
    parsedData?: TokenProgramData;
}): JSX.Element {
    const metadataExtension = mintInfo?.extensions?.find(
        ({ extension }: { extension: string }) => extension === 'tokenMetadata'
    );
    const metadataPointerExtension = mintInfo?.extensions?.find(
        ({ extension }: { extension: string }) => extension === 'metadataPointer'
    );

    const defaultCard = useMemo(
        () => (
            <TokenMintHeaderCard
                token={tokenInfo ? tokenInfo : { logoURI: undefined, name: undefined }}
                address={address}
                unverified={tokenInfo ? !tokenInfo.verified : false}
            />
        ),
        [address, tokenInfo]
    );

    if (metadataPointerExtension && metadataExtension) {
        return (
            <>
                <ErrorBoundary fallback={defaultCard}>
                    <Suspense fallback={defaultCard}>
                        <Token22MintHeader
                            address={address}
                            metadataExtension={metadataExtension as any}
                            metadataPointerExtension={metadataPointerExtension as any}
                        />
                    </Suspense>
                </ErrorBoundary>
            </>
        );
    }
    // Fall back to legacy token list when there is stub metadata (blank uri), updatable by default by the mint authority
    else if (!parsedData?.nftData?.metadata.data.uri && tokenInfo) {
        return defaultCard;
    } else if (parsedData?.nftData) {
        const token = {
            logoURI: parsedData?.nftData?.json?.image,
            name: parsedData?.nftData?.json?.name ?? parsedData?.nftData.metadata.data.name,
            symbol: parsedData?.nftData?.metadata.data.symbol,
        };
        return <TokenMintHeaderCard token={token} address={address} unverified={!tokenInfo?.verified} />;
    } else if (tokenInfo) {
        return defaultCard;
    }
    return defaultCard;
}

function Token22MintHeader({
    address,
    metadataExtension,
    metadataPointerExtension,
}: {
    address: string;
    metadataExtension: { extension: 'tokenMetadata'; state?: any };
    metadataPointerExtension: { extension: 'metadataPointer'; state?: any };
}) {
    const tokenMetadata = create(metadataExtension.state, TokenMetadata);
    const { metadataAddress } = create(metadataPointerExtension.state, MetadataPointer);
    const metadata = useMetadataJsonLink(getProxiedUri(tokenMetadata.uri), { suspense: true });

    const headerTokenMetadata = {
        logoURI: '',
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
    };
    if (metadata) {
        headerTokenMetadata.logoURI = metadata.image;
    }

    // Handles the basic case where MetadataPointer is referencing the Token Metadata extension directly
    // Does not handle the case where MetadataPointer is pointing at a separate account.
    if (metadataAddress?.toString() === address) {
        return <TokenMintHeaderCard address={address} token={headerTokenMetadata} unverified={false} />;
    }
    throw new Error('Metadata loading for non-token 2022 programs is not yet supported');
}

function TokenMintHeaderCard({
    address,
    token,
    unverified,
}: {
    address: string;
    token: { name?: string | undefined; logoURI?: string | undefined; symbol?: string | undefined };
    unverified: boolean;
}) {
    return (
        <div className="row align-items-center">
            {unverified && (
                <div className="alert alert-warning alert-scam" role="alert">
                    Warning! Token names and logos are not unique. This token may have spoofed its name and logo to look
                    like another token. Verify the token&apos;s mint address to ensure it is correct. If you are the
                    token creator, please verify your token on{' '}
                    <a
                        href="https://support.coingecko.com/hc/en-us/articles/23725417857817-Verification-Guide-for-Listing-Update-Requests-on-CoinGecko"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'white', textDecoration: 'underline' }}
                    >
                        Coingecko
                    </a>{' '}
                    or on{' '}
                    <a
                        href="https://verify.jup.ag/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'white', textDecoration: 'underline' }}
                    >
                        Jupiter
                    </a>
                    .
                </div>
            )}
            <div className="col-auto">
                <div className="avatar avatar-lg header-avatar-top">
                    {token?.logoURI ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            alt="token logo"
                            className="avatar-img rounded-circle border border-4 border-body"
                            height={16}
                            src={token.logoURI}
                            width={16}
                        />
                    ) : (
                        <Identicon
                            address={address}
                            className="avatar-img rounded-circle border border-body identicon-wrapper"
                            style={{ width: IDENTICON_WIDTH }}
                        />
                    )}
                </div>
            </div>

            <div className="col ms-n3 ms-md-n2">
                <h6 className="header-pretitle">Token</h6>
                <h2 className="header-title">{token?.name || 'Unknown Token'}</h2>
                <div className="header-pretitle no-overflow-with-ellipsis">
                    {token?.symbol ? token.symbol : 'No Symbol was found'}
                </div>
            </div>
        </div>
    );
}

function ProgramHeader({ address, parsedData }: { address: string; parsedData: UpgradeableLoaderAccountData }) {
    const securityTxt = useSecurityTxt(address, parsedData);

    const { programName, logo, version, unverified } = ((): {
        programName: string;
        logo?: string;
        version?: string;
        unverified?: boolean;
    } => {
        if (!securityTxt) {
            return {
                programName: 'Program Account',
                unverified: undefined,
            };
        }
        if (isPmpSecurityTXT(securityTxt)) {
            return {
                logo: getProxiedUri(securityTxt.logo),
                programName: securityTxt.name,
                unverified: true,
                version: securityTxt.version,
            };
        }
        return {
            programName: securityTxt.name,
            unverified: true,
        };
    })();

    const unverifiedChunk = (() => {
        if (!unverified) return null;
        if (unverified) {
            const text = 'Note that this is self-reported by the author of the program and might not be accurate';
            return (
                <div className="d-inline-flex align-items-center ms-2">
                    <span className="badge badge-pill bg-dark">Unverified</span>
                    <div style={{ width: '200px' }}>
                        <InfoTooltip text={text} />
                    </div>
                </div>
            );
        }
    })();

    return (
        <div className="row align-items-center">
            <div className="col-auto">
                <div className="avatar avatar-lg header-avatar-top">
                    {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            alt="Program logo"
                            className="avatar-img rounded border border-4 border-body"
                            height={16}
                            src={logo}
                            width={16}
                        />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Image
                            src={ProgramLogoPlaceholder}
                            height={IDENTICON_WIDTH}
                            width={IDENTICON_WIDTH}
                            alt="Program logo placeholder"
                            className="avatar-img rounded border border-body"
                        />
                    )}
                </div>
            </div>

            <div className="col ms-n3 ms-md-n2">
                <h6 className="header-pretitle">Program account</h6>
                <div className="d-inline-flex">
                    <h2 className="header-title">{programName}</h2>
                    {unverifiedChunk}
                </div>
                {version && <div className="header-pretitle no-overflow-with-ellipsis">{version}</div>}
            </div>
        </div>
    );
}
