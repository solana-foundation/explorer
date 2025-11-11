'use client';
import './styles.css';
import '@/app/types/bigint'; // polyfill toJSON for BigInt

import { AddressLookupTableAccountSection } from '@components/account/address-lookup-table/AddressLookupTableAccountSection';
import { isAddressLookupTableAccount } from '@components/account/address-lookup-table/types';
import { ConfigAccountSection } from '@components/account/ConfigAccountSection';
import { FeatureAccountSection } from '@components/account/FeatureAccountSection';
import { isNFTokenAccount, parseNFTokenCollectionAccount } from '@components/account/nftoken/isNFTokenAccount';
import { NFTOKEN_ADDRESS } from '@components/account/nftoken/nftoken';
import { NFTokenAccountSection } from '@components/account/nftoken/NFTokenAccountSection';
import { NonceAccountSection } from '@components/account/NonceAccountSection';
import { StakeAccountSection } from '@components/account/StakeAccountSection';
import { SysvarAccountSection } from '@components/account/SysvarAccountSection';
import { TokenAccountSection } from '@components/account/TokenAccountSection';
import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { UpgradeableLoaderAccountSection } from '@components/account/UpgradeableLoaderAccountSection';
import { VoteAccountSection } from '@components/account/VoteAccountSection';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Header } from '@components/Header';
import {
    Account,
    AccountsProvider,
    isTokenProgramData,
    TokenProgramData,
    UpgradeableLoaderAccountData,
    useAccountInfo,
    useFetchAccountInfo,
} from '@providers/accounts';
import FLAGGED_ACCOUNTS_WARNING from '@providers/accounts/flagged-accounts';
import { useAnchorProgram } from '@providers/anchor';
import { CacheEntry, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { Address } from '@solana/kit';
import { PROGRAM_ID as ACCOUNT_COMPRESSION_ID } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { FEATURE_PROGRAM_ID } from '@utils/parseFeatureAccount';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import { redirect, useSelectedLayoutSegment } from 'next/navigation';
import React, { PropsWithChildren, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SAS_PROGRAM_ID } from 'sas-lib';
import useSWRImmutable from 'swr/immutable';

import { CompressedNftCard } from '@/app/components/account/CompressedNftCard';
import { SolanaAttestationServiceCard } from '@/app/components/account/sas/SolanaAttestationCard';
import { useProgramMetadataIdl } from '@/app/entities/program-metadata';
import { hasTokenMetadata } from '@/app/features/metadata';
import { useCompressedNft } from '@/app/providers/compressed-nft';
import { useSquadsMultisigLookup } from '@/app/providers/squadsMultisig';
import { isAttestationAccount } from '@/app/utils/attestation-service';
import { getFeatureInfo, useFeatureInfo } from '@/app/utils/feature-gate/utils';
import { FullTokenInfo, getFullTokenInfo, isRedactedTokenAddress } from '@/app/utils/token-info';

const TABS_LOOKUP: { [id: string]: Tab[] } = {
    'address-lookup-table': [
        {
            path: 'entries',
            slug: 'entries',
            title: 'Table Entries',
        },
    ],
    attestation: [
        {
            path: 'attestation',
            slug: 'attestation',
            title: 'Attestation Service',
        },
    ],
    'bpf-upgradeable-loader': [
        {
            path: 'security',
            slug: 'security',
            title: 'Security',
        },
        {
            path: 'verified-build',
            slug: 'verified-build',
            title: 'Verified Build',
        },
    ],
    'nftoken:collection': [
        {
            path: 'nfts',
            slug: 'nftoken-collection-nfts',
            title: 'NFTs',
        },
    ],
    'spl-account-compression': [
        {
            path: 'concurrent-merkle-tree',
            slug: 'concurrent-merkle-tree',
            title: 'Concurrent Merkle Tree',
        },
    ],
    'spl-token-2022:mint': [
        {
            path: 'transfers',
            slug: 'transfers',
            title: 'Transfers',
        },
        {
            path: 'instructions',
            slug: 'instructions',
            title: 'Instructions',
        },
    ],
    'spl-token-2022:mint:metaplexNFT': [
        {
            path: 'metadata',
            slug: 'metadata',
            title: 'Metadata',
        },
        {
            path: 'attributes',
            slug: 'attributes',
            title: 'Attributes',
        },
    ],
    'spl-token:mint': [
        {
            path: 'transfers',
            slug: 'transfers',
            title: 'Transfers',
        },
        {
            path: 'instructions',
            slug: 'instructions',
            title: 'Instructions',
        },
    ],
    'spl-token:mint:metaplexNFT': [
        {
            path: 'metadata',
            slug: 'metadata',
            title: 'Metadata',
        },
        {
            path: 'attributes',
            slug: 'attributes',
            title: 'Attributes',
        },
    ],
    stake: [
        {
            path: 'rewards',
            slug: 'rewards',
            title: 'Rewards',
        },
    ],
    'sysvar:recentBlockhashes': [
        {
            path: 'blockhashes',
            slug: 'blockhashes',
            title: 'Blockhashes',
        },
    ],
    'sysvar:slotHashes': [
        {
            path: 'slot-hashes',
            slug: 'slot-hashes',
            title: 'Slot Hashes',
        },
    ],
    'sysvar:stakeHistory': [
        {
            path: 'stake-history',
            slug: 'stake-history',
            title: 'Stake History',
        },
    ],
    vote: [
        {
            path: 'vote-history',
            slug: 'vote-history',
            title: 'Vote History',
        },
        {
            path: 'rewards',
            slug: 'rewards',
            title: 'Rewards',
        },
    ],
};

const TOKEN_TABS_HIDDEN = ['spl-token:mint', 'spl-token-2022:mint', 'config', 'vote', 'sysvar', 'config'];

type Props = PropsWithChildren<{ params: { address: string } }>;

async function fetchFullTokenInfo([_, pubkey, cluster, url]: ['get-full-token-info', string, Cluster, string]) {
    return await getFullTokenInfo(new PublicKey(pubkey), cluster, url);
}

function AddressLayoutInner({ children, params: { address } }: Props) {
    const fetchAccount = useFetchAccountInfo();
    const { status, cluster, url } = useCluster();
    const info = useAccountInfo(address);

    let pubkey: PublicKey | undefined;

    try {
        pubkey = new PublicKey(address);
    } catch (err) {
        /* empty */
    }

    const infoStatus = info?.status;
    const infoParsed = info?.data?.data.parsed;

    const { data: fullTokenInfo, isLoading: isFullTokenInfoLoading } = useSWRImmutable(
        infoStatus === FetchStatus.Fetched && infoParsed && isTokenProgramData(infoParsed) && pubkey
            ? ['get-full-token-info', address, cluster, url]
            : null,
        fetchFullTokenInfo
    );

    // Fetch account on load
    React.useEffect(() => {
        if (!info && status === ClusterStatus.Connected && pubkey) {
            fetchAccount(pubkey, 'parsed');
        }
    }, [address, status]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="container mt-n3">
            <Header
                address={address}
                account={info?.data}
                tokenInfo={fullTokenInfo}
                isTokenInfoLoading={isFullTokenInfoLoading}
            />
            {!pubkey ? (
                <ErrorCard text={`Address "${address}" is not valid`} />
            ) : (
                <DetailsSections
                    info={info}
                    pubkey={pubkey}
                    tokenInfo={fullTokenInfo}
                    isTokenInfoLoading={isFullTokenInfoLoading}
                >
                    {children}
                </DetailsSections>
            )}
        </div>
    );
}

export default function AddressLayout({ children, params }: Props) {
    return (
        <AccountsProvider>
            <AddressLayoutInner params={params}>{children}</AddressLayoutInner>
        </AccountsProvider>
    );
}

function DetailsSections({
    children,
    pubkey,
    tab,
    info,
    tokenInfo,
    isTokenInfoLoading,
}: {
    children: React.ReactNode;
    pubkey: PublicKey;
    tab?: string;
    info?: CacheEntry<Account>;
    tokenInfo?: FullTokenInfo;
    isTokenInfoLoading: boolean;
}) {
    const fetchAccount = useFetchAccountInfo();
    const address = pubkey.toBase58();

    if (!info || info.status === FetchStatus.Fetching || isTokenInfoLoading) {
        return <LoadingCard />;
    } else if (info.status === FetchStatus.FetchFailed || info.data?.lamports === undefined) {
        return <ErrorCard retry={() => fetchAccount(pubkey, 'parsed')} text="Fetch Failed" />;
    }

    const account = info.data;
    const tabComponents = getTabs(pubkey, account).concat(getCustomLinkedTabs(pubkey, account));

    if (tab && tabComponents.filter(tabComponent => tabComponent.tab.slug === tab).length === 0) {
        redirect(`/address/${address}`);
    }

    return (
        <>
            {FLAGGED_ACCOUNTS_WARNING[address] ?? null}
            <InfoSection account={account} tokenInfo={tokenInfo} />
            <MoreSection tabs={tabComponents.map(({ component }) => component)}>{children}</MoreSection>
        </>
    );
}

function InfoSection({ account, tokenInfo }: { account: Account; tokenInfo?: FullTokenInfo }) {
    const parsedData = account.data.parsed;
    const rawData = account.data.raw;

    // get feature data from featureGates.json
    const featureInfo = useFeatureInfo({ address: account.pubkey.toBase58() });

    if (parsedData && parsedData.program === 'bpf-upgradeable-loader') {
        return (
            <UpgradeableLoaderAccountSection
                account={account}
                parsedData={parsedData.parsed}
                programData={parsedData.programData}
            />
        );
    } else if (parsedData && parsedData.program === 'stake') {
        return (
            <StakeAccountSection
                account={account}
                stakeAccount={parsedData.parsed.info}
                activation={parsedData.activation}
                stakeAccountType={parsedData.parsed.type}
            />
        );
    } else if (account.owner.toBase58() === NFTOKEN_ADDRESS) {
        return <NFTokenAccountSection account={account} />;
    } else if (parsedData && isTokenProgramData(parsedData)) {
        return <TokenAccountSection account={account} tokenAccount={parsedData.parsed} tokenInfo={tokenInfo} />;
    } else if (parsedData && parsedData.program === 'nonce') {
        return <NonceAccountSection account={account} nonceAccount={parsedData.parsed} />;
    } else if (parsedData && parsedData.program === 'vote') {
        return <VoteAccountSection account={account} voteAccount={parsedData.parsed} />;
    } else if (parsedData && parsedData.program === 'sysvar') {
        return <SysvarAccountSection account={account} sysvarAccount={parsedData.parsed} />;
    } else if (parsedData && parsedData.program === 'config') {
        return <ConfigAccountSection account={account} configAccount={parsedData.parsed} />;
    } else if (
        parsedData &&
        parsedData.program === 'address-lookup-table' &&
        parsedData.parsed.type === 'lookupTable'
    ) {
        return <AddressLookupTableAccountSection account={account} lookupTableAccount={parsedData.parsed.info} />;
    } else if (rawData && isAddressLookupTableAccount(account.owner.toBase58() as Address, rawData)) {
        return <AddressLookupTableAccountSection account={account} data={rawData} />;
    } else if (featureInfo || account.owner.toBase58() === FEATURE_PROGRAM_ID) {
        return <FeatureAccountSection account={account} />;
    } else if (account.owner.toBase58() === SAS_PROGRAM_ID) {
        return <SolanaAttestationServiceCard account={account} />;
    } else {
        const fallback = <UnknownAccountCard account={account} />;
        return (
            <ErrorBoundary fallback={fallback}>
                <Suspense fallback={fallback}>
                    <CompressedNftCard account={account} />
                </Suspense>
            </ErrorBoundary>
        );
    }
}

type Tab = {
    slug: MoreTabs;
    title: string;
    path: string;
};

type TabComponent = {
    tab: Tab;
    component: JSX.Element | null;
};

export type MoreTabs =
    | 'history'
    | 'tokens'
    | 'nftoken-collection-nfts'
    | 'vote-history'
    | 'slot-hashes'
    | 'stake-history'
    | 'blockhashes'
    | 'transfers'
    | 'instructions'
    | 'rewards'
    | 'metadata'
    | 'attributes'
    | 'domains'
    | 'security'
    | 'idl'
    | 'anchor-account'
    | 'entries'
    | 'concurrent-merkle-tree'
    | 'compression'
    | 'verified-build'
    | 'program-multisig'
    | 'feature-gate'
    | 'token-extensions'
    | 'attestation';

function MoreSection({ children, tabs }: { children: React.ReactNode; tabs: (JSX.Element | null)[] }) {
    return (
        <>
            <div className="container">
                <div className="header">
                    <div className="header-body pt-0">
                        <ul className="nav nav-tabs nav-overflow header-tabs">{tabs}</ul>
                    </div>
                </div>
            </div>
            {children}
        </>
    );
}

function getTabs(pubkey: PublicKey, account: Account): TabComponent[] {
    const address = pubkey.toBase58();
    const parsedData = account.data.parsed;
    const tabs: (Tab & { compressed?: boolean })[] = [
        {
            path: '',
            slug: 'history',
            title: 'History',
        },
    ];

    let programTypeKey = '';
    if (parsedData) {
        programTypeKey = `${parsedData.program}:${parsedData.parsed.type}`;
    }

    if (parsedData && parsedData.program in TABS_LOOKUP) {
        tabs.push(...TABS_LOOKUP[parsedData.program]);
    }

    if (parsedData && programTypeKey in TABS_LOOKUP) {
        tabs.push(...TABS_LOOKUP[programTypeKey]);
    }

    // Add the key for address lookup tables
    if (account.data.raw && isAddressLookupTableAccount(account.owner.toBase58() as Address, account.data.raw)) {
        tabs.push(...TABS_LOOKUP['address-lookup-table']);
    }

    // Add the key for Metaplex NFTs
    if (
        parsedData &&
        (programTypeKey === 'spl-token:mint' || programTypeKey == 'spl-token-2022:mint') &&
        (parsedData as TokenProgramData).nftData
    ) {
        tabs.push(...TABS_LOOKUP[`${programTypeKey}:metaplexNFT`]);
    }

    if (hasTokenMetadata(parsedData)) {
        tabs.push({
            path: 'metadata',
            slug: 'metadata',
            title: 'Metadata',
        });
    }

    // Compressed NFT tabs
    if ((!account.data.raw || account.data.raw.length === 0) && !account.data.parsed) {
        tabs.push(
            {
                compressed: true,
                path: 'metadata',
                slug: 'metadata',
                title: 'Metadata',
            },
            {
                compressed: true,
                path: 'attributes',
                slug: 'attributes',
                title: 'Attributes',
            },
            { compressed: true, path: 'compression', slug: 'compression', title: 'Compression' }
        );
    }

    const isNFToken = account && isNFTokenAccount(account);
    if (isNFToken) {
        const collection = parseNFTokenCollectionAccount(account);
        if (collection) {
            tabs.push({
                path: 'nftoken-collection-nfts',
                slug: 'nftoken-collection-nfts',
                title: 'NFTs',
            });
        }
    }

    if (
        !isNFToken &&
        (!parsedData || !(TOKEN_TABS_HIDDEN.includes(parsedData.program) || TOKEN_TABS_HIDDEN.includes(programTypeKey)))
    ) {
        tabs.push({
            path: 'tokens',
            slug: 'tokens',
            title: 'Tokens',
        });
        tabs.push({
            path: 'domains',
            slug: 'domains',
            title: 'Domains',
        });
    }

    if (account.owner.toBase58() === ACCOUNT_COMPRESSION_ID.toBase58()) {
        tabs.push(TABS_LOOKUP['spl-account-compression'][0]);
    }

    if (isAttestationAccount(account)) {
        tabs.push(...TABS_LOOKUP['attestation']);
    }

    if (isRedactedTokenAddress(address)) {
        const metadataIndex = tabs.findIndex(tab => tab.slug === 'metadata');
        if (metadataIndex !== -1) {
            tabs.splice(metadataIndex, 1);
        }
    }

    return tabs.map(tab => {
        return {
            component: !tab.compressed ? (
                <Tab address={address} key={tab.slug} path={tab.path} title={tab.title} />
            ) : (
                <React.Suspense key={tab.slug} fallback={<></>}>
                    <CompressedNftLink tab={tab} address={pubkey.toString()} pubkey={pubkey} />
                </React.Suspense>
            ),
            tab,
        };
    });
}

function Tab({ address, path, title }: { address: string; path: string; title: string }) {
    const tabPath = useClusterPath({ pathname: `/address/${address}/${path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = (selectedLayoutSegment === null && path === '') || selectedLayoutSegment === path;
    return (
        <li className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={tabPath} scroll={false}>
                {title}
            </Link>
        </li>
    );
}

function getCustomLinkedTabs(pubkey: PublicKey, account: Account) {
    const tabComponents = [];
    const programMultisigTab: Tab = {
        path: 'program-multisig',
        slug: 'program-multisig',
        title: 'Program Multisig',
    };
    tabComponents.push({
        component: (
            <React.Suspense key={programMultisigTab.slug} fallback={<></>}>
                <ProgramMultisigLink
                    tab={programMultisigTab}
                    address={pubkey.toString()}
                    authority={
                        (account.data.parsed as UpgradeableLoaderAccountData | undefined)?.programData?.authority
                    }
                />
            </React.Suspense>
        ),
        tab: programMultisigTab,
    });

    // Add extensions tab for Token Extensions program accounts
    if (account.owner.toBase58() === TOKEN_2022_PROGRAM_ADDRESS) {
        const extensionsTab: Tab = {
            path: 'token-extensions',
            slug: 'token-extensions',
            title: 'Extensions',
        };
        tabComponents.push({
            component: <TokenExtensionsLink key={extensionsTab.slug} tab={extensionsTab} address={pubkey.toString()} />,
            tab: extensionsTab,
        });
    }

    const idlProgramTab: Tab = {
        path: 'idl',
        slug: 'idl',
        title: 'Program IDL',
    };
    tabComponents.push({
        component: (
            <React.Suspense key={idlProgramTab.slug} fallback={<></>}>
                <ProgramIdlLink tab={idlProgramTab} address={pubkey.toString()} pubkey={pubkey} />
            </React.Suspense>
        ),
        tab: idlProgramTab,
    });

    const accountDataTab: Tab = {
        path: 'anchor-account',
        slug: 'anchor-account',
        title: 'Anchor Data',
    };
    tabComponents.push({
        component: (
            <React.Suspense key={accountDataTab.slug} fallback={<></>}>
                <AccountDataLink tab={accountDataTab} address={pubkey.toString()} programId={account.owner} />
            </React.Suspense>
        ),
        tab: accountDataTab,
    });

    // Feature-specific information
    if (getFeatureInfo(pubkey.toBase58())) {
        const featureInfoTab: Tab = {
            path: 'feature-gate',
            slug: 'feature-gate',
            title: 'Feature Gate',
        };
        tabComponents.push({
            component: <FeatureGateLink key={featureInfoTab.slug} tab={featureInfoTab} address={pubkey.toString()} />,
            tab: featureInfoTab,
        });
    }

    return tabComponents;
}

function ProgramIdlLink({ tab, address, pubkey }: { tab: Tab; address: string; pubkey: PublicKey }) {
    const { url, cluster } = useCluster();
    const { idl } = useAnchorProgram(pubkey.toString(), url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(pubkey.toString(), url, cluster);
    const anchorProgramPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;

    if (!idl && !programMetadataIdl) {
        return null;
    }

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={anchorProgramPath}>
                {tab.title}
            </Link>
        </li>
    );
}

function AccountDataLink({ address, tab, programId }: { address: string; tab: Tab; programId: PublicKey }) {
    const { url, cluster } = useCluster();
    const { program: accountAnchorProgram } = useAnchorProgram(programId.toString(), url, cluster);
    const accountDataPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;
    if (!accountAnchorProgram) {
        return null;
    }

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={accountDataPath}>
                {tab.title}
            </Link>
        </li>
    );
}

function FeatureGateLink({ address, tab }: { address: string; tab: Tab }) {
    const accountDataPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;
    const featureInfo = useFeatureInfo({ address });
    // Do not render "Feature Gate" tab on absent feature data
    if (!featureInfo) {
        return null;
    }

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={accountDataPath}>
                {tab.title}
            </Link>
        </li>
    );
}

// Checks that a compressed NFT exists at the given address and returns a link to the tab
function CompressedNftLink({ tab, address, pubkey }: { tab: Tab; address: string; pubkey: PublicKey }) {
    const { url } = useCluster();
    const compressedNft = useCompressedNft({ address: pubkey.toString(), url });
    const tabPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });

    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;

    if (!compressedNft || !compressedNft.compression.compressed) {
        return null;
    }

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={tabPath}>
                {tab.title}
            </Link>
        </li>
    );
}

// Checks that a program multisig exists at the given address and returns a link to the tab
function ProgramMultisigLink({
    tab,
    address,
    authority,
}: {
    tab: Tab;
    address: string;
    authority: PublicKey | null | undefined;
}) {
    const { cluster } = useCluster();
    const { data: squadMapInfo, error } = useSquadsMultisigLookup(authority, cluster);
    const tabPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;
    if (!squadMapInfo || error || !squadMapInfo.isSquad) {
        return null;
    }

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={tabPath}>
                {tab.title}
            </Link>
        </li>
    );
}

function TokenExtensionsLink({ address, tab }: { address: string; tab: Tab }) {
    const accountDataPath = useClusterPath({ pathname: `/address/${address}/${tab.path}` });
    const selectedLayoutSegment = useSelectedLayoutSegment();
    const isActive = selectedLayoutSegment === tab.path;

    return (
        <li key={tab.slug} className="nav-item">
            <Link className={`${isActive ? 'active ' : ''}nav-link`} href={accountDataPath}>
                {tab.title}
            </Link>
        </li>
    );
}
