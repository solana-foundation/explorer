import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { useRefreshAccount } from '@entities/account';
import { isMetaplexNFT } from '@entities/nft';
import { fetchTokenInfoFromApi, getTokenInfoSwrKey } from '@entities/token-info';
import { AccountCard } from '@features/account';
import { isSome } from '@metaplex-foundation/umi';
import { Account, NFTData } from '@providers/accounts';
import { TOKEN_2022_PROGRAM_ID, useScaledUiAmountMultiplier } from '@providers/accounts/tokens';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { normalizeTokenAmount } from '@utils/index';
import { getCurrentTokenScaledUiAmountMultiplier } from '@utils/token-info';
import { addressLabel } from '@utils/tx';
import { MintAccountInfo, MultisigAccountInfo, TokenAccount, TokenAccountInfo } from '@validators/accounts/token';
import { TokenExtension } from '@validators/accounts/token-extension';
import { BigNumber } from 'bignumber.js';
import { capitalCase } from 'change-case';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';
import { create } from 'superstruct';
import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';
import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';
import { KeyValue, type KeyValueRow, type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';
import { FullTokenInfo } from '@/app/utils/token-info';

import { TokenExtensionsStatusRow } from './token-extensions/TokenExtensionsStatusRow';
import { UnknownAccountCard } from './UnknownAccountCard';

const getEthAddress = (link?: string) => {
    let address = '';
    if (link) {
        // eslint-disable-next-line no-restricted-syntax -- extract Ethereum address from URL
        const extractEth = link.match(/0x[a-fA-F0-9]{40,64}/);

        if (extractEth) {
            address = extractEth[0];
        }
    }

    return address;
};

export const StatusBadge = ({ status }: { status: string }) => (
    <Badge ui="dashkit" variant={status === 'initialized' ? 'success' : 'warning'}>
        {capitalCase(status)}
    </Badge>
);

export function TokenAccountSection({
    account,
    tokenAccount,
    tokenInfo,
}: {
    account: Account;
    tokenAccount: TokenAccount;
    tokenInfo?: FullTokenInfo;
}) {
    const { cluster } = useCluster();

    try {
        switch (tokenAccount.type) {
            case 'mint': {
                const mintInfo = create(tokenAccount.info, MintAccountInfo);

                const parsedData = account.data.parsed;
                if (isMetaplexNFT(parsedData, mintInfo)) {
                    invariant(parsedData.nftData, 'isMetaplexNFT returned true but nftData is missing');
                    return (
                        <NonFungibleTokenMintAccountCard
                            account={account}
                            nftData={parsedData.nftData}
                            mintInfo={mintInfo}
                        />
                    );
                }

                return <FungibleTokenMintAccountCard account={account} mintInfo={mintInfo} tokenInfo={tokenInfo} />;
            }
            case 'account': {
                const info = create(tokenAccount.info, TokenAccountInfo);
                return <TokenAccountCard account={account} info={info} />;
            }
            case 'multisig': {
                const info = create(tokenAccount.info, MultisigAccountInfo);
                return <MultisigAccountCard account={account} info={info} />;
            }
        }
    } catch (err) {
        if (cluster !== Cluster.Custom) {
            Logger.error(err, {
                address: account.pubkey.toBase58(),
            });
        }
    }
    return <UnknownAccountCard account={account} />;
}

function FungibleTokenMintAccountCard({
    account,
    mintInfo,
    tokenInfo,
}: {
    account: Account;
    mintInfo: MintAccountInfo;
    tokenInfo?: FullTokenInfo;
}) {
    const fetchInfo = useRefreshAccount();

    const bridgeContractAddress = getEthAddress(tokenInfo?.extensions?.bridgeContract);
    const assetContractAddress = getEthAddress(tokenInfo?.extensions?.assetContract);

    const mintExtensions = mintInfo.extensions?.slice();
    mintExtensions?.sort(cmpExtension);
    const scaledUiAmountMultiplier = getCurrentTokenScaledUiAmountMultiplier(mintExtensions);

    const rows: KeyValueRowInput[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        {
            label: mintInfo.mintAuthority === null ? 'Fixed Supply' : 'Current Supply',
            value: (
                <>
                    <span>
                        {normalizeTokenAmount(
                            Number(mintInfo.supply) * Number(scaledUiAmountMultiplier),
                            mintInfo.decimals,
                        ).toLocaleString('en-US', {
                            maximumFractionDigits: 20,
                        })}
                    </span>
                    <ScaledUiAmountMultiplierTooltip
                        rawAmount={normalizeTokenAmount(Number(mintInfo.supply), mintInfo.decimals).toString()}
                        scaledUiAmountMultiplier={{ multiplier: scaledUiAmountMultiplier, status: 'known' }}
                    />
                </>
            ),
        },
        tokenInfo?.extensions?.website && {
            label: 'Website',
            value: (
                <ExternalLink href={tokenInfo.extensions.website}>
                    {tokenInfo.extensions.website}
                    <ExternalLinkIcon className="ml-1.5 align-text-top" size={13} />
                </ExternalLink>
            ),
        },
        mintInfo.mintAuthority && {
            label: 'Mint Authority',
            value: <Address pubkey={mintInfo.mintAuthority} link />,
        },
        mintInfo.freezeAuthority && {
            label: 'Freeze Authority',
            value: <Address pubkey={mintInfo.freezeAuthority} link />,
        },
        { label: 'Decimals', value: mintInfo.decimals },
        !mintInfo.isInitialized && { label: 'Status', value: 'Uninitialized' },
        tokenInfo?.extensions?.bridgeContract &&
            bridgeContractAddress && {
                label: 'Bridge Contract',
                value: (
                    <Copyable text={bridgeContractAddress}>
                        <ExternalLink href={tokenInfo.extensions.bridgeContract}>{bridgeContractAddress}</ExternalLink>
                    </Copyable>
                ),
            },
        tokenInfo?.extensions?.assetContract &&
            assetContractAddress && {
                label: 'Bridged Asset Contract',
                value: (
                    <Copyable text={assetContractAddress}>
                        <ExternalLink href={tokenInfo.extensions.assetContract}>{assetContractAddress}</ExternalLink>
                    </Copyable>
                ),
            },
    ];

    return (
        <AccountCard
            title={
                tokenInfo
                    ? 'Overview'
                    : account.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58()
                      ? 'Token-2022 Mint'
                      : 'Token Mint'
            }
            account={account}
            refresh={() => fetchInfo(account.pubkey, 'parsed')}
            analyticsSection="token_mint_card"
        >
            <KeyValueRows rows={rows} />
            {mintExtensions && (
                <TokenExtensionsStatusRow address={account.pubkey.toBase58()} extensions={mintExtensions} />
            )}
        </AccountCard>
    );
}

function NonFungibleTokenMintAccountCard({
    account,
    nftData,
    mintInfo,
}: {
    account: Account;
    nftData: NFTData;
    mintInfo: MintAccountInfo;
}) {
    const fetchInfo = useRefreshAccount();

    const collectionOpt = nftData.metadata.collection;
    const collection = collectionOpt && isSome(collectionOpt) ? collectionOpt.value : null;
    const maxSupplyOpt =
        nftData.editionInfo.masterEdition && 'maxSupply' in nftData.editionInfo.masterEdition
            ? nftData.editionInfo.masterEdition.maxSupply
            : undefined;
    const maxSupply = maxSupplyOpt && isSome(maxSupplyOpt) ? Number(maxSupplyOpt.value) : null;

    const rows: KeyValueRowInput[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Owner', value: <Address pubkey={account.owner} link /> },
        maxSupply != null && { label: 'Max Total Supply', value: maxSupply === 0 ? 1 : maxSupply },
        nftData?.editionInfo.masterEdition != null && {
            label: 'Current Supply',
            value:
                Number(nftData.editionInfo.masterEdition.supply) === 0
                    ? 1
                    : Number(nftData.editionInfo.masterEdition.supply),
        },
        collection?.verified && {
            label: 'Verified Collection Address',
            value: <Address pubkey={new PublicKey(collection.key.toString())} link />,
        },
        mintInfo.mintAuthority && {
            label: 'Mint Authority',
            value: <Address pubkey={mintInfo.mintAuthority} link />,
        },
        mintInfo.freezeAuthority && {
            label: 'Freeze Authority',
            value: <Address pubkey={mintInfo.freezeAuthority} link />,
        },
        {
            label: 'Update Authority',
            value: <Address pubkey={new PublicKey(nftData.metadata.updateAuthority.toString())} link />,
        },
        nftData?.json &&
            nftData.json.external_url && {
                label: 'Website',
                value: (
                    <ExternalLink href={nftData.json.external_url}>
                        {nftData.json.external_url}
                        <ExternalLinkIcon className="ml-1.5 align-text-top" size={13} />
                    </ExternalLink>
                ),
            },
        nftData?.metadata && {
            label: 'Seller Fee',
            value: `${nftData.metadata.sellerFeeBasisPoints / 100}%`,
        },
    ];

    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(account.pubkey, 'parsed')}
            analyticsSection="nft_mint_card"
        >
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await fetchTokenInfoFromApi(new PublicKey(address), cluster, url);
}

function TokenAccountCard({ account, info }: { account: Account; info: TokenAccountInfo }) {
    const refresh = useRefreshAccount();
    const scaledUiAmountMultiplier = useScaledUiAmountMultiplier(info.mint.toBase58());
    const { cluster, url } = useCluster();
    const label = addressLabel(account.pubkey.toBase58(), cluster);
    const swrKey = useMemo(() => getTokenInfoSwrKey(info.mint.toString(), cluster, url), [cluster, info.mint, url]);

    const { data: tokenInfo } = useSWR(swrKey, fetchTokenInfo);
    const [symbol, setSymbol] = useState<string | undefined>(undefined);
    const accountExtensions = info.extensions?.slice();
    accountExtensions?.sort(cmpExtension);

    const balance = info.isNative ? (
        <>
            {'\u25ce'}
            <span className="font-mono">{new BigNumber(info.tokenAmount.uiAmountString).toFormat(9)}</span>
        </>
    ) : (
        <>{info.tokenAmount.uiAmountString}</>
    );

    useEffect(() => {
        if (info.isNative) {
            setSymbol('SOL');
        } else {
            setSymbol(tokenInfo?.symbol);
        }
    }, [tokenInfo, info]);

    const rows: KeyValueRowInput[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        label && { label: 'Address Label', value: label },
        { label: 'Mint', value: <Address pubkey={info.mint} link tokenLabelInfo={tokenInfo} /> },
        { label: 'Owner', value: <Address pubkey={info.owner} link /> },
        {
            label: <>Token balance {typeof symbol === 'string' && `(${symbol})`}</>,
            value: (
                <>
                    {balance}
                    <ScaledUiAmountMultiplierTooltip
                        rawAmount={normalizeTokenAmount(
                            Number(info.tokenAmount.amount),
                            info.tokenAmount.decimals || 0,
                        ).toString()}
                        scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                    />
                </>
            ),
        },
        { label: 'Status', value: <StatusBadge status={info.state} /> },
        info.rentExemptReserve && {
            label: 'Rent-exempt reserve (SOL)',
            value: (
                <span className="font-mono">◎{new BigNumber(info.rentExemptReserve.uiAmountString).toFormat(9)}</span>
            ),
        },
        info.delegate && {
            label: 'Delegate',
            value: <Address pubkey={info.delegate} link />,
        },
        info.delegate && {
            label: <>Delegated amount {typeof symbol === 'string' && `(${symbol})`}</>,
            value: info.isNative ? (
                <>
                    {'\u25ce'}
                    <span className="font-mono">
                        {new BigNumber(info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0').toFormat(9)}
                    </span>
                </>
            ) : (
                <>{info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0'}</>
            ),
        },
    ];

    return (
        <AccountCard
            title={<>Token{account.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58() && '-2022'} Account</>}
            account={account}
            analyticsSection="token_account_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
            {accountExtensions && (
                <TokenExtensionsStatusRow address={account.pubkey.toBase58()} extensions={accountExtensions} />
            )}
        </AccountCard>
    );
}

function MultisigAccountCard({ account, info }: { account: Account; info: MultisigAccountInfo }) {
    const refresh = useRefreshAccount();

    const headerRows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Required Signers', value: info.numRequiredSigners },
        { label: 'Valid Signers', value: info.numValidSigners },
    ];

    return (
        <AccountCard
            title="Multisig Account"
            account={account}
            analyticsSection="multisig_account_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={headerRows} />
            {info.signers.map(signer => (
                <KeyValue key={signer.toString()} label="Signer">
                    <Address pubkey={signer} link />
                </KeyValue>
            ))}
            {!info.isInitialized && <KeyValue label="Status">Uninitialized</KeyValue>}
        </AccountCard>
    );
}

function cmpExtension(a: TokenExtension, b: TokenExtension) {
    const sortedExtensionTypes: TokenExtension['extension'][] = [
        'transferFeeAmount',
        'mintCloseAuthority',
        'defaultAccountState',
        'immutableOwner',
        'memoTransfer',
        'nonTransferable',
        'nonTransferableAccount',
        'cpiGuard',
        'pausableAccount',
        'permanentDelegate',
        'permissionedBurnConfig',
        'transferHook',
        'transferHookAccount',
        'metadataPointer',
        'groupPointer',
        'groupMemberPointer',
        'confidentialTransferAccount',
        'confidentialTransferFeeConfig',
        'confidentialTransferFeeAmount',
        'confidentialTransferMint',
        'confidentialMintBurn',
        'interestBearingConfig',
        'pausableConfig',
        'scaledUiAmountConfig',
        'transferFeeConfig',
        'tokenGroup',
        'tokenGroupMember',
        'tokenMetadata',
        'unparseableExtension',
    ];
    // An unknown name has no index, so it sorts after every listed name.
    const rank = ({ extension }: TokenExtension): number => {
        const index = sortedExtensionTypes.indexOf(extension);
        return index === -1 ? sortedExtensionTypes.length : index;
    };
    return rank(a) - rank(b);
}
