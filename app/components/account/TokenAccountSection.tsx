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

import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';
import { getSafeExternalUrl } from '@/app/shared/lib/safe-external-url';
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

const StatusBadge = ({ status }: { status: string }) => {
    const badgeClass = status === 'initialized' ? 'bg-success-soft' : 'bg-warning-soft';
    return <span className={`badge ${badgeClass}`}>{capitalCase(status)}</span>;
};

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

    const websiteUrl = getSafeExternalUrl(tokenInfo?.extensions?.website);
    const bridgeContractUrl = getSafeExternalUrl(tokenInfo?.extensions?.bridgeContract);
    const assetContractUrl = getSafeExternalUrl(tokenInfo?.extensions?.assetContract);
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
            <tr>
                <td>Address</td>
                <td className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>{mintInfo.mintAuthority === null ? 'Fixed Supply' : 'Current Supply'}</td>
                <td className="text-md-end">
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
                </td>
            </tr>
            {tokenInfo?.extensions?.website && (
                <tr>
                    <td>Website</td>
                    <td className="text-md-end">
                        {websiteUrl ? (
                            <a rel="noopener noreferrer" target="_blank" href={websiteUrl}>
                                {tokenInfo.extensions.website}
                                <ExternalLink className="align-text-top ms-2" size={13} />
                            </a>
                        ) : (
                            tokenInfo.extensions.website
                        )}
                    </td>
                </tr>
            )}
            {mintInfo.mintAuthority && (
                <tr>
                    <td>Mint Authority</td>
                    <td className="text-md-end">
                        <Address pubkey={mintInfo.mintAuthority} alignRight link />
                    </td>
                </tr>
            )}
            {mintInfo.freezeAuthority && (
                <tr>
                    <td>Freeze Authority</td>
                    <td className="text-md-end">
                        <Address pubkey={mintInfo.freezeAuthority} alignRight link />
                    </td>
                </tr>
            )}
            <tr>
                <td>Decimals</td>
                <td className="text-md-end">{mintInfo.decimals}</td>
            </tr>
            {!mintInfo.isInitialized && (
                <tr>
                    <td>Status</td>
                    <td className="text-md-end">Uninitialized</td>
                </tr>
            )}
            {tokenInfo?.extensions?.bridgeContract && bridgeContractAddress && (
                <tr>
                    <td>Bridge Contract</td>
                    <td className="text-md-end">
                        <Copyable text={bridgeContractAddress}>
                            {bridgeContractUrl ? (
                                <a href={bridgeContractUrl} target="_blank" rel="noreferrer">
                                    {bridgeContractAddress}
                                </a>
                            ) : (
                                <span>{bridgeContractAddress}</span>
                            )}
                        </Copyable>
                    </td>
                </tr>
            )}
            {tokenInfo?.extensions?.assetContract && assetContractAddress && (
                <tr>
                    <td>Bridged Asset Contract</td>
                    <td className="text-md-end">
                        <Copyable text={assetContractAddress}>
                            {assetContractUrl ? (
                                <a href={assetContractUrl} target="_blank" rel="noreferrer">
                                    {assetContractAddress}
                                </a>
                            ) : (
                                <span>{assetContractAddress}</span>
                            )}
                        </Copyable>
                    </td>
                </tr>
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
    const externalUrl = getSafeExternalUrl(nftData?.json?.external_url);

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
            <tr>
                <td>Address</td>
                <td className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td className="text-md-end">
                    <Address pubkey={account.owner} alignRight link />
                </td>
            </tr>
            {maxSupply != null && (
                <tr>
                    <td>Max Total Supply</td>
                    <td className="text-md-end">{maxSupply === 0 ? 1 : maxSupply}</td>
                </tr>
            )}
            {nftData?.editionInfo.masterEdition != null && (
                <tr>
                    <td>Current Supply</td>
                    <td className="text-md-end">
                        {Number(nftData.editionInfo.masterEdition.supply) === 0
                            ? 1
                            : Number(nftData.editionInfo.masterEdition.supply)}
                    </td>
                </tr>
            )}
            {collection?.verified && (
                <tr>
                    <td>Verified Collection Address</td>
                    <td className="text-md-end">
                        <Address pubkey={new PublicKey(collection.key.toString())} alignRight link />
                    </td>
                </tr>
            )}
            {mintInfo.mintAuthority && (
                <tr>
                    <td>Mint Authority</td>
                    <td className="text-md-end">
                        <Address pubkey={mintInfo.mintAuthority} alignRight link />
                    </td>
                </tr>
            )}
            {mintInfo.freezeAuthority && (
                <tr>
                    <td>Freeze Authority</td>
                    <td className="text-md-end">
                        <Address pubkey={mintInfo.freezeAuthority} alignRight link />
                    </td>
                </tr>
            )}
            <tr>
                <td>Update Authority</td>
                <td className="text-md-end">
                    <Address pubkey={new PublicKey(nftData.metadata.updateAuthority.toString())} alignRight link />
                </td>
            </tr>
            {nftData?.json && nftData.json.external_url && (
                <tr>
                    <td>Website</td>
                    <td className="text-md-end">
                        {externalUrl ? (
                            <a rel="noopener noreferrer" target="_blank" href={externalUrl}>
                                {nftData.json.external_url}
                                <ExternalLink className="align-text-top ms-2" size={13} />
                            </a>
                        ) : (
                            nftData.json.external_url
                        )}
                    </td>
                </tr>
            )}
            {nftData?.metadata && (
                <tr>
                    <td>Seller Fee</td>
                    <td className="text-md-end">{`${nftData.metadata.sellerFeeBasisPoints / 100}%`}</td>
                </tr>
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
            <span className="font-monospace">{new BigNumber(info.tokenAmount.uiAmountString).toFormat(9)}</span>
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
            <tr>
                <td>Address</td>
                <td className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            {label && (
                <tr>
                    <td>Address Label</td>
                    <td className="text-md-end">{label}</td>
                </tr>
            )}
            <tr>
                <td>Mint</td>
                <td className="text-md-end">
                    <Address pubkey={info.mint} alignRight link tokenLabelInfo={tokenInfo} />
                </td>
            </tr>
            <tr>
                <td>Owner</td>
                <td className="text-md-end">
                    <Address pubkey={info.owner} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Token balance {typeof symbol === 'string' && `(${symbol})`}</td>
                <td className="text-md-end">
                    {balance}
                    <ScaledUiAmountMultiplierTooltip
                        rawAmount={normalizeTokenAmount(
                            Number(info.tokenAmount.amount),
                            info.tokenAmount.decimals || 0,
                        ).toString()}
                        scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                    />
                </td>
            </tr>
            <tr>
                <td>Status</td>
                <td className="text-md-end">
                    <StatusBadge status={info.state} />
                </td>
            </tr>
            {info.rentExemptReserve && (
                <tr>
                    <td>Rent-exempt reserve (SOL)</td>
                    <td className="text-md-end">
                        <span className="font-monospace">
                            ◎{new BigNumber(info.rentExemptReserve.uiAmountString).toFormat(9)}
                        </span>
                    </td>
                </tr>
            )}
            {info.delegate && (
                <>
                    <tr>
                        <td>Delegate</td>
                        <td className="text-md-end">
                            <Address pubkey={info.delegate} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Delegated amount {typeof symbol === 'string' && `(${symbol})`}</td>
                        <td className="text-md-end">
                            {info.isNative ? (
                                <>
                                    {'\u25ce'}
                                    <span className="font-monospace">
                                        {new BigNumber(
                                            info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0',
                                        ).toFormat(9)}
                                    </span>
                                </>
                            ) : (
                                <>{info.delegatedAmount ? info.delegatedAmount.uiAmountString : '0'}</>
                            )}
                        </td>
                    </tr>
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
            <tr>
                <td>Address</td>
                <td className="text-md-end">
                    <Address pubkey={account.pubkey} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Required Signers</td>
                <td className="text-md-end">{info.numRequiredSigners}</td>
            </tr>
            <tr>
                <td>Valid Signers</td>
                <td className="text-md-end">{info.numValidSigners}</td>
            </tr>
            {info.signers.map(signer => (
                <tr key={signer.toString()}>
                    <td>Signer</td>
                    <td className="text-md-end">
                        <Address pubkey={signer} alignRight link />
                    </td>
                </tr>
            ))}
            {!info.isInitialized && (
                <tr>
                    <td>Status</td>
                    <td className="text-md-end">Uninitialized</td>
                </tr>
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
        <tr>
            {/*use important here as there is rule from .table-sm that affects all the underline elements*/}
            <th colSpan={2} className="e-mb-2 !e-p-4 e-text-[15px] e-font-normal">
                {name}
            </th>
        </tr>
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
                    <tr>
                        <td>Close Authority</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.closeAuthority} alignRight link />
                        </td>
                    </tr>
                );
            } else {
                return <></>;
            }
        }
        case 'transferFeeAmount': {
            const extension = create(tokenExtension.state, TransferFeeAmount);
            return (
                <tr>
                    <td>Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</td>
                    <td className="text-md-end">
                        {normalizeTokenAmount(extension.withheldAmount, decimals).toLocaleString('en-US', {
                            maximumFractionDigits: 20,
                        })}
                    </td>
                </tr>
            );
        }
        case 'transferFeeConfig': {
            const extension = create(tokenExtension.state, TransferFeeConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Transfer Fee Config" /> : null}
                    {extension.transferFeeConfigAuthority && (
                        <tr>
                            <td>Transfer Fee Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.transferFeeConfigAuthority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>{extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Fee Epoch</td>
                        <td className="text-md-end">{extension.olderTransferFee.epoch}</td>
                    </tr>
                    <tr>
                        <td>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </td>
                        <td className="text-md-end">
                            {normalizeTokenAmount(extension.olderTransferFee.maximumFee, decimals).toLocaleString(
                                'en-US',
                                {
                                    maximumFractionDigits: 20,
                                },
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>{extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Fee Rate</td>
                        <td className="text-md-end">{`${extension.olderTransferFee.transferFeeBasisPoints / 100}%`}</td>
                    </tr>
                    <tr>
                        <td>{extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Fee Epoch</td>
                        <td className="text-md-end">{extension.newerTransferFee.epoch}</td>
                    </tr>
                    <tr>
                        <td>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </td>
                        <td className="text-md-end">
                            {normalizeTokenAmount(extension.newerTransferFee.maximumFee, decimals).toLocaleString(
                                'en-US',
                                {
                                    maximumFractionDigits: 20,
                                },
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>{extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Fee Rate</td>
                        <td className="text-md-end">{`${extension.newerTransferFee.transferFeeBasisPoints / 100}%`}</td>
                    </tr>
                    {extension.withdrawWithheldAuthority && (
                        <tr>
                            <td>Withdraw Withheld Fees Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.withdrawWithheldAuthority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</td>
                        <td className="text-md-end">
                            {normalizeTokenAmount(extension.withheldAmount, decimals).toLocaleString('en-US', {
                                maximumFractionDigits: 20,
                            })}
                        </td>
                    </tr>
                </>
            );
        }
        case 'confidentialTransferMint': {
            const extension = create(tokenExtension.state, ConfidentialTransferMint);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer" /> : null}
                    {extension.authority && (
                        <tr>
                            <td>Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.auditorElgamalPubkey && (
                        <tr>
                            <td>Auditor Elgamal Pubkey</td>
                            <td className="text-md-end">{extension.auditorElgamalPubkey}</td>
                        </tr>
                    )}
                    <tr>
                        <td>New Account Approval Policy</td>
                        <td className="text-md-end">{extension.autoApproveNewAccounts ? 'auto' : 'manual'}</td>
                    </tr>
                </>
            );
        }
        case 'confidentialTransferFeeConfig': {
            const extension = create(tokenExtension.state, ConfidentialTransferFeeConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer Fee" /> : null}
                    {extension.authority && (
                        <tr>
                            <td>Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.withdrawWithheldAuthorityElgamalPubkey && (
                        <tr>
                            <td>Auditor Elgamal Pubkey</td>
                            <td className="text-md-end">{extension.withdrawWithheldAuthorityElgamalPubkey}</td>
                        </tr>
                    )}
                    <tr>
                        <td>Harvest to Mint</td>
                        <td className="text-md-end">{extension.harvestToMintEnabled ? 'enabled' : 'disabled'}</td>
                    </tr>
                    <tr>
                        <td>Encrypted Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</td>
                        <td className="text-md-end">{extension.withheldAmount}</td>
                    </tr>
                </>
            );
        }
        case 'defaultAccountState': {
            const extension = create(tokenExtension.state, DefaultAccountState);
            return (
                <tr>
                    <td>DefaultAccountState</td>
                    <td className="text-md-end">{extension.accountState}</td>
                </tr>
            );
        }
        case 'nonTransferable': {
            return (
                <tr>
                    <td>Non-Transferable</td>
                    <td className="text-md-end">enabled</td>
                </tr>
            );
        }
        case 'interestBearingConfig': {
            const extension = create(tokenExtension.state, InterestBearingConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Interest-Bearing" /> : null}
                    {extension.rateAuthority && (
                        <tr>
                            <td>Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.rateAuthority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Current Rate</td>
                        <td className="text-md-end">{`${extension.currentRate / 100}%`}</td>
                    </tr>
                    <tr>
                        <td>Pre-Current Average Rate</td>
                        <td className="text-md-end">{`${extension.preUpdateAverageRate / 100}%`}</td>
                    </tr>
                    <tr>
                        <td>Last Update Timestamp</td>
                        <td className="text-md-end">{displayTimestamp(extension.lastUpdateTimestamp * 1000)}</td>
                    </tr>
                    <tr>
                        <td>Initialization Timestamp</td>
                        <td className="text-md-end">{displayTimestamp(extension.initializationTimestamp * 1000)}</td>
                    </tr>
                </>
            );
        }
        case 'scaledUiAmountConfig': {
            const extension = create(tokenExtension.state, ScaledUiAmountConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Scaled UI Amount" /> : null}
                    {extension.authority && (
                        <tr>
                            <td>Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Multiplier</td>
                        <td className="text-md-end">{extension.multiplier}</td>
                    </tr>
                    <tr>
                        <td>New Multiplier</td>
                        <td className="text-md-end">{extension.newMultiplier}</td>
                    </tr>
                    <tr>
                        <td>New Multiplier Effective Timestamp</td>
                        <td className="text-md-end">
                            {displayTimestamp(extension.newMultiplierEffectiveTimestamp * 1000)}
                        </td>
                    </tr>
                </>
            );
        }
        case 'pausableAccount': {
            return (
                <tr>
                    <td>Pausable Account</td>
                    <td className="text-md-end">enabled</td>
                </tr>
            );
        }
        case 'pausableConfig': {
            const extension = create(tokenExtension.state, PausableConfig);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Pausable" /> : null}
                    <>
                        {extension.authority && (
                            <tr>
                                <td>Authority</td>
                                <td className="text-md-end">
                                    <Address pubkey={extension.authority} alignRight link />
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td>Paused</td>
                            <td className="text-md-end">{extension.paused ? 'paused' : 'not paused'}</td>
                        </tr>
                    </>
                </>
            );
        }
        case 'permanentDelegate': {
            const extension = create(tokenExtension.state, PermanentDelegate);
            if (extension.delegate) {
                return (
                    <tr>
                        <td>Permanent Delegate</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.delegate} alignRight link />
                        </td>
                    </tr>
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
                        <tr>
                            <td>Transfer Hook Program Id</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.programId} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.authority && (
                        <tr>
                            <td>Transfer Hook Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                </>
            );
        }
        case 'metadataPointer': {
            const extension = create(tokenExtension.state, MetadataPointer);
            return (
                <>
                    {extension.metadataAddress && (
                        <tr>
                            <td>Metadata</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.metadataAddress} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.authority && (
                        <tr>
                            <td>Metadata Pointer Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                </>
            );
        }
        case 'groupPointer': {
            const extension = create(tokenExtension.state, GroupPointer);
            return (
                <>
                    {extension.groupAddress && (
                        <tr>
                            <td>Token Group</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.groupAddress} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.authority && (
                        <tr>
                            <td>Group Pointer Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                </>
            );
        }
        case 'groupMemberPointer': {
            const extension = create(tokenExtension.state, GroupMemberPointer);
            return (
                <>
                    {extension.memberAddress && (
                        <tr>
                            <td>Token Group Member</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.memberAddress} alignRight link />
                            </td>
                        </tr>
                    )}
                    {extension.authority && (
                        <tr>
                            <td>Member Pointer Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                </>
            );
        }
        case 'tokenMetadata': {
            const extension = create(tokenExtension.state, TokenMetadata);
            const uri = getSafeExternalUrl(extension.uri);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Metadata" /> : null}
                    <tr>
                        <td>Mint</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </td>
                    </tr>
                    {extension.updateAuthority && (
                        <tr>
                            <td>Update Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Name</td>
                        <td className="text-md-end">{extension.name}</td>
                    </tr>
                    <tr>
                        <td>Symbol</td>
                        <td className="text-md-end">{extension.symbol}</td>
                    </tr>
                    <tr>
                        <td>URI</td>
                        <td className="text-md-end">
                            {uri ? (
                                <a rel="noopener noreferrer" target="_blank" href={uri}>
                                    {extension.uri}
                                    <ExternalLink className="align-text-top ms-2" size={13} />
                                </a>
                            ) : (
                                extension.uri
                            )}
                        </td>
                    </tr>
                    {extension.additionalMetadata?.length > 0 && (
                        <>
                            <tr>
                                {/*use important here as there is rule from .table-sm that affects all the underline elements*/}
                                <th colSpan={2} className="e-mb-2 e-h-5 !e-pl-6 e-font-normal e-italic">
                                    Additional Metadata
                                </th>
                            </tr>
                            {extension.additionalMetadata?.map(keyValuePair => (
                                <tr key="{keyValuePair[0]}">
                                    <td>{keyValuePair[0]}</td>
                                    <td className="text-md-end">{keyValuePair[1]}</td>
                                </tr>
                            ))}
                        </>
                    )}
                </>
            );
        }
        case 'cpiGuard': {
            const extension = create(tokenExtension.state, CpiGuard);
            return (
                <tr>
                    <td>CPI Guard</td>
                    <td className="text-md-end">{extension.lockCpi ? 'enabled' : 'disabled'}</td>
                </tr>
            );
        }
        case 'confidentialTransferAccount': {
            const extension = create(tokenExtension.state, ConfidentialTransferAccount);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Confidential Transfer" /> : null}
                    <tr>
                        <td>Status</td>
                        <td className="text-md-end">{!extension.approved && 'not '}approved</td>
                    </tr>
                    <tr>
                        <td>Elgamal Pubkey</td>
                        <td className="text-md-end">{extension.elgamalPubkey}</td>
                    </tr>
                    <tr>
                        <td>Confidential Credits</td>
                        <td className="text-md-end">{extension.allowConfidentialCredits ? 'enabled' : 'disabled'}</td>
                    </tr>
                    <tr>
                        <td>Non-confidential Credits</td>
                        <td className="text-md-end">
                            {extension.allowNonConfidentialCredits ? 'enabled' : 'disabled'}
                        </td>
                    </tr>
                    <tr>
                        <td>Available Balance</td>
                        <td className="text-md-end">{extension.availableBalance}</td>
                    </tr>
                    <tr>
                        <td>Decryptable Available Balance</td>
                        <td className="text-md-end">{extension.decryptableAvailableBalance}</td>
                    </tr>
                    <tr>
                        <td>Pending Balance, Low Bits</td>
                        <td className="text-md-end">{extension.pendingBalanceLo}</td>
                    </tr>
                    <tr>
                        <td>Pending Balance, High Bits</td>
                        <td className="text-md-end">{extension.pendingBalanceHi}</td>
                    </tr>
                    <tr>
                        <td>Pending Balance Credit Counter</td>
                        <td className="text-md-end">{extension.pendingBalanceCreditCounter}</td>
                    </tr>
                    <tr>
                        <td>Expected Pending Balance Credit Counter</td>
                        <td className="text-md-end">{extension.expectedPendingBalanceCreditCounter}</td>
                    </tr>
                    <tr>
                        <td>Actual Pending Balance Credit Counter</td>
                        <td className="text-md-end">{extension.actualPendingBalanceCreditCounter}</td>
                    </tr>
                    <tr>
                        <td>Maximum Pending Balance Credit Counter</td>
                        <td className="text-md-end">{extension.maximumPendingBalanceCreditCounter}</td>
                    </tr>
                </>
            );
        }
        case 'immutableOwner': {
            return (
                <tr>
                    <td>Immutable Owner</td>
                    <td className="text-md-end">enabled</td>
                </tr>
            );
        }
        case 'memoTransfer': {
            const extension = create(tokenExtension.state, MemoTransfer);
            return (
                <tr>
                    <td>Require Memo on Incoming Transfers</td>
                    <td className="text-md-end">{extension.requireIncomingTransferMemos ? 'enabled' : 'disabled'}</td>
                </tr>
            );
        }
        case 'transferHookAccount': {
            const extension = create(tokenExtension.state, TransferHookAccount);
            return (
                <tr>
                    <td>Transfer Hook Status</td>
                    <td className="text-md-end">{!extension.transferring && 'not '}transferring</td>
                </tr>
            );
        }
        case 'nonTransferableAccount': {
            return (
                <tr>
                    <td>Non-Transferable</td>
                    <td className="text-md-end">enabled</td>
                </tr>
            );
        }
        case 'confidentialTransferFeeAmount': {
            const extension = create(tokenExtension.state, ConfidentialTransferFeeAmount);
            return (
                <tr>
                    <td>Encrypted Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</td>
                    <td className="text-md-end">{extension.withheldAmount}</td>
                </tr>
            );
        }
        case 'tokenGroup': {
            const extension = create(tokenExtension.state, TokenGroup);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Group" /> : null}
                    <tr>
                        <td>Mint</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </td>
                    </tr>
                    {extension.updateAuthority && (
                        <tr>
                            <td>Update Authority</td>
                            <td className="text-md-end">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Current Size</td>
                        <td className="text-md-end">{extension.size}</td>
                    </tr>
                    <tr>
                        <td>Max Size</td>
                        <td className="text-md-end">{extension.maxSize}</td>
                    </tr>
                </>
            );
        }
        case 'tokenGroupMember': {
            const extension = create(tokenExtension.state, TokenGroupMember);
            return (
                <>
                    {headerStyle === 'header' ? <HHeader name="Group Member" /> : null}
                    <tr>
                        <td>Mint</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.mint} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Group</td>
                        <td className="text-md-end">
                            <Address pubkey={extension.group} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Member Number</td>
                        <td className="text-md-end">{extension.memberNumber}</td>
                    </tr>
                </>
            );
        }
        case 'unparseableExtension':
        default:
            return (
                <tr>
                    <td>Unknown Extension</td>
                    <td className="text-md-end">unparseable</td>
                </tr>
            );
    }
}
