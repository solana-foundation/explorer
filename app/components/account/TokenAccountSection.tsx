import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { useRefreshAccount } from '@entities/account';
import { isMetaplexNFT } from '@entities/nft';
import { AccountCard } from '@features/account';
import { isSome } from '@metaplex-foundation/umi';
import { Account, NFTData } from '@providers/accounts';
import { TOKEN_2022_PROGRAM_ID, useScaledUiAmountForMint } from '@providers/accounts/tokens';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { displayTimestamp } from '@utils/date';
import { normalizeTokenAmount } from '@utils/index';
import { getCurrentTokenScaledUiAmountMultiplier } from '@utils/token-info';
import { addressLabel } from '@utils/tx';
import { MintAccountInfo, MultisigAccountInfo, TokenAccount, TokenAccountInfo } from '@validators/accounts/token';
import {
    ConfidentialTransferAccount,
    ConfidentialTransferFeeAmount,
    ConfidentialTransferFeeConfig,
    ConfidentialTransferMint,
    CpiGuard,
    DefaultAccountState,
    GroupMemberPointer,
    GroupPointer,
    InterestBearingConfig,
    MemoTransfer,
    MetadataPointer,
    MintCloseAuthority,
    PausableConfig,
    PermanentDelegate,
    ScaledUiAmountConfig,
    TokenExtension,
    TokenExtensionType,
    TokenGroup,
    TokenGroupMember,
    TokenMetadata,
    TransferFeeAmount,
    TransferFeeConfig,
    TransferHook,
    TransferHookAccount,
} from '@validators/accounts/token-extension';
import { BigNumber } from 'bignumber.js';
import { capitalCase } from 'change-case';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'react-feather';
import { create } from 'superstruct';
import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';
import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';
import { BaseTable } from '@/app/shared/ui/Table';
import { FullLegacyTokenInfo, getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';

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

const StatusBadge = ({ status }: { status: string }) => (
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
    tokenInfo?: FullLegacyTokenInfo;
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
    tokenInfo?: FullLegacyTokenInfo;
}) {
    const fetchInfo = useRefreshAccount();

    const bridgeContractAddress = getEthAddress(tokenInfo?.extensions?.bridgeContract);
    const assetContractAddress = getEthAddress(tokenInfo?.extensions?.assetContract);

    const mintExtensions = mintInfo.extensions?.slice();
    mintExtensions?.sort(cmpExtension);
    const scaledUiAmountMultiplier = getCurrentTokenScaledUiAmountMultiplier(mintExtensions);

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
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>{mintInfo.mintAuthority === null ? 'Fixed Supply' : 'Current Supply'}</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
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
                        scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                    />
                </BaseTable.Cell>
            </BaseTable.Row>
            {tokenInfo?.extensions?.website && (
                <BaseTable.Row>
                    <BaseTable.Cell>Website</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <a rel="noopener noreferrer" target="_blank" href={tokenInfo.extensions.website}>
                            {tokenInfo.extensions.website}
                            <ExternalLink className="align-text-top e-ml-1.5" size={13} />
                        </a>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {mintInfo.mintAuthority && (
                <BaseTable.Row>
                    <BaseTable.Cell>Mint Authority</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={mintInfo.mintAuthority} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {mintInfo.freezeAuthority && (
                <BaseTable.Row>
                    <BaseTable.Cell>Freeze Authority</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={mintInfo.freezeAuthority} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Decimals</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">{mintInfo.decimals}</BaseTable.Cell>
            </BaseTable.Row>
            {!mintInfo.isInitialized && (
                <BaseTable.Row>
                    <BaseTable.Cell>Status</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">Uninitialized</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {tokenInfo?.extensions?.bridgeContract && bridgeContractAddress && (
                <BaseTable.Row>
                    <BaseTable.Cell>Bridge Contract</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Copyable text={bridgeContractAddress}>
                            <a href={tokenInfo.extensions.bridgeContract} target="_blank" rel="noreferrer">
                                {bridgeContractAddress}
                            </a>
                        </Copyable>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {tokenInfo?.extensions?.assetContract && assetContractAddress && (
                <BaseTable.Row>
                    <BaseTable.Cell>Bridged Asset Contract</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Copyable text={assetContractAddress}>
                            <a href={tokenInfo.extensions.bridgeContract} target="_blank" rel="noreferrer">
                                {assetContractAddress}
                            </a>
                        </Copyable>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
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
    return (
        <AccountCard
            title="Overview"
            account={account}
            refresh={() => fetchInfo(account.pubkey, 'parsed')}
            analyticsSection="nft_mint_card"
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={account.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {maxSupply != null && (
                <BaseTable.Row>
                    <BaseTable.Cell>Max Total Supply</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">{maxSupply === 0 ? 1 : maxSupply}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            {nftData?.editionInfo.masterEdition != null && (
                <BaseTable.Row>
                    <BaseTable.Cell>Current Supply</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        {Number(nftData.editionInfo.masterEdition.supply) === 0
                            ? 1
                            : Number(nftData.editionInfo.masterEdition.supply)}
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {collection?.verified && (
                <BaseTable.Row>
                    <BaseTable.Cell>Verified Collection Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={new PublicKey(collection.key.toString())} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {mintInfo.mintAuthority && (
                <BaseTable.Row>
                    <BaseTable.Cell>Mint Authority</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={mintInfo.mintAuthority} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {mintInfo.freezeAuthority && (
                <BaseTable.Row>
                    <BaseTable.Cell>Freeze Authority</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={mintInfo.freezeAuthority} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Update Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={new PublicKey(nftData.metadata.updateAuthority.toString())} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            {nftData?.json && nftData.json.external_url && (
                <BaseTable.Row>
                    <BaseTable.Cell>Website</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <a rel="noopener noreferrer" target="_blank" href={nftData.json.external_url}>
                            {nftData.json.external_url}
                            <ExternalLink className="align-text-top e-ml-1.5" size={13} />
                        </a>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {nftData?.metadata && (
                <BaseTable.Row>
                    <BaseTable.Cell>Seller Fee</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">{`${nftData.metadata.sellerFeeBasisPoints / 100}%`}</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </AccountCard>
    );
}

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

function TokenAccountCard({ account, info }: { account: Account; info: TokenAccountInfo }) {
    const refresh = useRefreshAccount();
    const [_, scaledUiAmountMultiplier] = useScaledUiAmountForMint(info.mint.toBase58(), info.tokenAmount.amount);
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
            <span className="e-font-mono">{new BigNumber(info.tokenAmount.uiAmountString).toFormat(9)}</span>
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

    return (
        <AccountCard
            title={<>Token{account.owner.toBase58() === TOKEN_2022_PROGRAM_ID.toBase58() && '-2022'} Account</>}
            account={account}
            analyticsSection="token_account_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            {label && (
                <BaseTable.Row>
                    <BaseTable.Cell>Address Label</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">{label}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Mint</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={info.mint} alignRight link tokenLabelInfo={tokenInfo} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={info.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Token balance {typeof symbol === 'string' && `(${symbol})`}</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    {balance}
                    <ScaledUiAmountMultiplierTooltip
                        rawAmount={normalizeTokenAmount(
                            Number(info.tokenAmount.amount),
                            info.tokenAmount.decimals || 0,
                        ).toString()}
                        scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                    />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Status</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <StatusBadge status={info.state} />
                </BaseTable.Cell>
            </BaseTable.Row>
            {info.rentExemptReserve && (
                <BaseTable.Row>
                    <BaseTable.Cell>Rent-exempt reserve (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <span className="e-font-mono">
                            ◎{new BigNumber(info.rentExemptReserve.uiAmountString).toFormat(9)}
                        </span>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
            {info.delegate && (
                <>
                    <BaseTable.Row>
                        <BaseTable.Cell>Delegate</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={info.delegate} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Delegated amount {typeof symbol === 'string' && `(${symbol})`}</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {info.isNative ? (
                                <>
                                    {'\u25ce'}
                                    <span className="e-font-mono">
                                        {new BigNumber(
                                            info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0',
                                        ).toFormat(9)}
                                    </span>
                                </>
                            ) : (
                                <>{info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0'}</>
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            )}
            {accountExtensions && (
                <TokenExtensionsStatusRow address={account.pubkey.toBase58()} extensions={accountExtensions} />
            )}
        </AccountCard>
    );
}

function MultisigAccountCard({ account, info }: { account: Account; info: MultisigAccountInfo }) {
    const refresh = useRefreshAccount();

    return (
        <AccountCard
            title="Multisig Account"
            account={account}
            analyticsSection="multisig_account_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Required Signers</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">{info.numRequiredSigners}</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Valid Signers</BaseTable.Cell>
                <BaseTable.Cell className="text-md-end">{info.numValidSigners}</BaseTable.Cell>
            </BaseTable.Row>
            {info.signers.map(signer => (
                <BaseTable.Row key={signer.toString()}>
                    <BaseTable.Cell>Signer</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        <Address pubkey={signer} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            ))}
            {!info.isInitialized && (
                <BaseTable.Row>
                    <BaseTable.Cell>Status</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">Uninitialized</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </AccountCard>
    );
}

function cmpExtension(a: TokenExtension, b: TokenExtension) {
    // be sure that extensions with a header row always come later
    const sortedExtensionTypes: TokenExtensionType[] = [
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
        'transferHook',
        'transferHookAccount',
        'metadataPointer',
        'groupPointer',
        'groupMemberPointer',
        // everything below this comment includes a header row
        'confidentialTransferAccount',
        'confidentialTransferFeeConfig',
        'confidentialTransferFeeAmount',
        'confidentialTransferMint',
        'interestBearingConfig',
        'pausableConfig',
        'scaledUiAmountConfig',
        'transferFeeConfig',
        'tokenGroup',
        'tokenGroupMember',
        'tokenMetadata',
        // always keep this last
        'unparseableExtension',
    ];
    return sortedExtensionTypes.indexOf(a.extension) - sortedExtensionTypes.indexOf(b.extension);
}

function HHeader({ name }: { name: string }) {
    return (
        <BaseTable.Row>
            {/*use important here as there is rule from .table-sm that affects all the underline elements*/}
            <BaseTable.HeaderCell colSpan={2} className="e-mb-2 !e-p-4 e-text-[15px] e-font-normal">
                {name}
            </BaseTable.HeaderCell>
        </BaseTable.Row>
    );
}

/* Do not move component to keep commit history.
    NOTE: Needs to be separated at closest refactoring
    Also check whether it is needed to keep it as function and not a proper React component
*/
export function TokenExtensionRow(
    tokenExtension: TokenExtension,
    maybeEpoch: bigint | undefined,
    decimals: number,
    symbol: string | undefined,
    headerStyle: 'header' | 'omit' = 'header',
) {
    const epoch = maybeEpoch || 0n; // fallback to 0 if not provided
    switch (tokenExtension.extension) {
        case 'mintCloseAuthority': {
            const extension = create(tokenExtension.state, MintCloseAuthority);
            if (extension.closeAuthority) {
                return (
                    <BaseTable.Row>
                        <BaseTable.Cell>Close Authority</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.closeAuthority} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            } else {
                return <></>;
            }
        }
        case 'transferFeeAmount': {
            const extension = create(tokenExtension.state, TransferFeeAmount);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        {normalizeTokenAmount(extension.withheldAmount, decimals).toLocaleString('en-US', {
                            maximumFractionDigits: 20,
                        })}
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'transferFeeConfig': {
            const extension = create(tokenExtension.state, TransferFeeConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Transfer Fee Config" /> : null}
                    {extension.transferFeeConfigAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Transfer Fee Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.transferFeeConfigAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Fee Epoch
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.olderTransferFee.epoch}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {normalizeTokenAmount(extension.olderTransferFee.maximumFee, decimals).toLocaleString(
                                'en-US',
                                {
                                    maximumFractionDigits: 20,
                                },
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Fee Rate
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{`${extension.olderTransferFee.transferFeeBasisPoints / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Fee Epoch
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.newerTransferFee.epoch}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {normalizeTokenAmount(extension.newerTransferFee.maximumFee, decimals).toLocaleString(
                                'en-US',
                                {
                                    maximumFractionDigits: 20,
                                },
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Fee Rate
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{`${extension.newerTransferFee.transferFeeBasisPoints / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.withdrawWithheldAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Withdraw Withheld Fees Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.withdrawWithheldAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {normalizeTokenAmount(extension.withheldAmount, decimals).toLocaleString('en-US', {
                                maximumFractionDigits: 20,
                            })}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'confidentialTransferMint': {
            const extension = create(tokenExtension.state, ConfidentialTransferMint);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer" /> : null}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.auditorElgamalPubkey && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Auditor Elgamal Pubkey</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">{extension.auditorElgamalPubkey}</BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>New Account Approval Policy</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.autoApproveNewAccounts ? 'auto' : 'manual'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'confidentialTransferFeeConfig': {
            const extension = create(tokenExtension.state, ConfidentialTransferFeeConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer Fee" /> : null}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.withdrawWithheldAuthorityElgamalPubkey && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Auditor Elgamal Pubkey</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                {extension.withdrawWithheldAuthorityElgamalPubkey}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Harvest to Mint</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.harvestToMintEnabled ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            Encrypted Withheld Amount {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.withheldAmount}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'defaultAccountState': {
            const extension = create(tokenExtension.state, DefaultAccountState);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>DefaultAccountState</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">{extension.accountState}</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'nonTransferable': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Non-Transferable</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'interestBearingConfig': {
            const extension = create(tokenExtension.state, InterestBearingConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Interest-Bearing" /> : null}
                    {extension.rateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.rateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Current Rate</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{`${extension.currentRate / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pre-Current Average Rate</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{`${extension.preUpdateAverageRate / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Last Update Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {displayTimestamp(extension.lastUpdateTimestamp * 1000)}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Initialization Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {displayTimestamp(extension.initializationTimestamp * 1000)}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'scaledUiAmountConfig': {
            const extension = create(tokenExtension.state, ScaledUiAmountConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Scaled UI Amount" /> : null}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Multiplier</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.multiplier}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>New Multiplier</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.newMultiplier}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>New Multiplier Effective Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {displayTimestamp(extension.newMultiplierEffectiveTimestamp * 1000)}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'pausableAccount': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Pausable Account</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'pausableConfig': {
            const extension = create(tokenExtension.state, PausableConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Pausable" /> : null}
                    <>
                        {extension.authority && (
                            <BaseTable.Row>
                                <BaseTable.Cell>Authority</BaseTable.Cell>
                                <BaseTable.Cell className="text-md-end">
                                    <Address pubkey={extension.authority} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        <BaseTable.Row>
                            <BaseTable.Cell>Paused</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                {extension.paused ? 'paused' : 'not paused'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </>
                </>
            );
        }
        case 'permanentDelegate': {
            const extension = create(tokenExtension.state, PermanentDelegate);
            if (extension.delegate) {
                return (
                    <BaseTable.Row>
                        <BaseTable.Cell>Permanent Delegate</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.delegate} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            } else {
                return <></>;
            }
        }
        case 'transferHook': {
            const extension = create(tokenExtension.state, TransferHook);
            return (
                <>
                    {extension.programId && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Transfer Hook Program Id</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Transfer Hook Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                </>
            );
        }
        case 'metadataPointer': {
            const extension = create(tokenExtension.state, MetadataPointer);
            return (
                <>
                    {extension.metadataAddress && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Metadata</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.metadataAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Metadata Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                </>
            );
        }
        case 'groupPointer': {
            const extension = create(tokenExtension.state, GroupPointer);
            return (
                <>
                    {extension.groupAddress && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Token Group</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.groupAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Group Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                </>
            );
        }
        case 'groupMemberPointer': {
            const extension = create(tokenExtension.state, GroupMemberPointer);
            return (
                <>
                    {extension.memberAddress && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Token Group Member</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.memberAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Member Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                </>
            );
        }
        case 'tokenMetadata': {
            const extension = create(tokenExtension.state, TokenMetadata);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Metadata" /> : null}
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.updateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Update Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Name</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.name}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Symbol</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.symbol}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>URI</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.uri.startsWith('http') ? (
                                <a rel="noopener noreferrer" target="_blank" href={extension.uri}>
                                    {extension.uri}
                                    <ExternalLink className="align-text-top e-ml-1.5" size={13} />
                                </a>
                            ) : (
                                extension.uri
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.additionalMetadata?.length > 0 && (
                        <>
                            <BaseTable.Row>
                                {/*use important here as there is rule from .table-sm that affects all the underline elements*/}
                                <BaseTable.HeaderCell
                                    colSpan={2}
                                    className="e-mb-2 e-h-5 !e-pl-6 e-font-normal e-italic"
                                >
                                    Additional Metadata
                                </BaseTable.HeaderCell>
                            </BaseTable.Row>
                            {extension.additionalMetadata?.map(keyValuePair => (
                                <BaseTable.Row key="{keyValuePair[0]}">
                                    <BaseTable.Cell>{keyValuePair[0]}</BaseTable.Cell>
                                    <BaseTable.Cell className="text-md-end">{keyValuePair[1]}</BaseTable.Cell>
                                </BaseTable.Row>
                            ))}
                        </>
                    )}
                </>
            );
        }
        case 'cpiGuard': {
            const extension = create(tokenExtension.state, CpiGuard);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>CPI Guard</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        {extension.lockCpi ? 'enabled' : 'disabled'}
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'confidentialTransferAccount': {
            const extension = create(tokenExtension.state, ConfidentialTransferAccount);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer" /> : null}
                    <BaseTable.Row>
                        <BaseTable.Cell>Status</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{!extension.approved && 'not '}approved</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Elgamal Pubkey</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.elgamalPubkey}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Confidential Credits</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.allowConfidentialCredits ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Non-confidential Credits</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.allowNonConfidentialCredits ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Available Balance</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.availableBalance}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Decryptable Available Balance</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.decryptableAvailableBalance}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance, Low Bits</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.pendingBalanceLo}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance, High Bits</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.pendingBalanceHi}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.pendingBalanceCreditCounter}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Expected Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.expectedPendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Actual Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.actualPendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Maximum Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            {extension.maximumPendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'immutableOwner': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Immutable Owner</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'memoTransfer': {
            const extension = create(tokenExtension.state, MemoTransfer);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Require Memo on Incoming Transfers</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        {extension.requireIncomingTransferMemos ? 'enabled' : 'disabled'}
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'transferHookAccount': {
            const extension = create(tokenExtension.state, TransferHookAccount);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Transfer Hook Status</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">
                        {!extension.transferring && 'not '}transferring
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'nonTransferableAccount': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Non-Transferable</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'confidentialTransferFeeAmount': {
            const extension = create(tokenExtension.state, ConfidentialTransferFeeAmount);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>
                        Encrypted Withheld Amount {typeof symbol === 'string' && `(${symbol})`}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">{extension.withheldAmount}</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'tokenGroup': {
            const extension = create(tokenExtension.state, TokenGroup);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Group" /> : null}
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.updateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Update Authority</BaseTable.Cell>
                            <BaseTable.Cell className="text-md-end">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Current Size</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.size}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Max Size</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.maxSize}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'tokenGroupMember': {
            const extension = create(tokenExtension.state, TokenGroupMember);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Group Member" /> : null}
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Group</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">
                            <Address pubkey={extension.group} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Member Number</BaseTable.Cell>
                        <BaseTable.Cell className="text-md-end">{extension.memberNumber}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'unparseableExtension':
        default:
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Unknown Extension</BaseTable.Cell>
                    <BaseTable.Cell className="text-md-end">unparseable</BaseTable.Cell>
                </BaseTable.Row>
            );
    }
}
