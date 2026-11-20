import { Address } from '@components/common/Address';
import { normalizeTokenAmount } from '@utils/index';
import {
    ConfidentialMintBurn,
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
    PermissionedBurnConfig,
    ScaledUiAmountConfig,
    TokenExtension,
    TokenGroup,
    TokenGroupMember,
    TokenMetadata,
    TransferFeeAmount,
    TransferFeeConfig,
    TransferHook,
    TransferHookAccount,
} from '@validators/accounts/token-extension';
import { ExternalLink as ExternalLinkIcon } from 'react-feather';
import { create } from 'superstruct';

import { ExternalLink } from '@/app/components/shared/ui/external-link';
import { Timestamp } from '@/app/components/shared/ui/timestamp';
import { getSafeExternalHref } from '@/app/shared/lib/url';
import { BaseTable } from '@/app/shared/ui/Table';

export function TokenExtensionRow({
    decimals,
    epoch = 0n,
    symbol,
    tokenExtension,
}: {
    decimals: number;
    epoch?: bigint;
    symbol?: string;
    tokenExtension: TokenExtension;
}) {
    switch (tokenExtension.extension) {
        case 'mintCloseAuthority': {
            const extension = create(tokenExtension.state, MintCloseAuthority);
            if (extension.closeAuthority) {
                return (
                    <BaseTable.Row>
                        <BaseTable.Cell>Close Authority</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                    <BaseTable.Cell className="md:text-right">
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
                    {extension.transferFeeConfigAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Transfer Fee Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.transferFeeConfigAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Fee Epoch
                        </BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.olderTransferFee.epoch}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Current' : 'Previous'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                        <BaseTable.Cell className="md:text-right">{`${extension.olderTransferFee.transferFeeBasisPoints / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Fee Epoch
                        </BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.newerTransferFee.epoch}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            {extension.newerTransferFee.epoch > epoch ? 'Future' : 'Current'} Maximum Fee{' '}
                            {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                        <BaseTable.Cell className="md:text-right">{`${extension.newerTransferFee.transferFeeBasisPoints / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.withdrawWithheldAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Withdraw Withheld Fees Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.withdrawWithheldAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Withheld Amount {typeof symbol === 'string' && `(${symbol})`}</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.auditorElgamalPubkey && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Auditor Elgamal Pubkey</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">{extension.auditorElgamalPubkey}</BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>New Account Approval Policy</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.autoApproveNewAccounts ? 'auto' : 'manual'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'confidentialMintBurn': {
            const extension = create(tokenExtension.state, ConfidentialMintBurn);
            return (
                <>
                    <BaseTable.Row>
                        <BaseTable.Cell>Supply Elgamal Pubkey</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.supplyElgamalPubkey}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Confidential Supply</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.confidentialSupply}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Decryptable Supply</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.decryptableSupply}</BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.pendingBurn !== undefined && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Pending Burn</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">{extension.pendingBurn}</BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                </>
            );
        }
        case 'confidentialTransferFeeConfig': {
            const extension = create(tokenExtension.state, ConfidentialTransferFeeConfig);
            return (
                <>
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.withdrawWithheldAuthorityElgamalPubkey && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Auditor Elgamal Pubkey</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                {extension.withdrawWithheldAuthorityElgamalPubkey}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Harvest to Mint</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.harvestToMintEnabled ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>
                            Encrypted Withheld Amount {typeof symbol === 'string' && `(${symbol})`}
                        </BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.withheldAmount}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'defaultAccountState': {
            const extension = create(tokenExtension.state, DefaultAccountState);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>DefaultAccountState</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">{extension.accountState}</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'nonTransferable': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Non-Transferable</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'interestBearingConfig': {
            const extension = create(tokenExtension.state, InterestBearingConfig);
            return (
                <>
                    {extension.rateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.rateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Current Rate</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{`${extension.currentRate / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pre-Current Average Rate</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{`${extension.preUpdateAverageRate / 100}%`}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Last Update Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Timestamp unixTimestamp={extension.lastUpdateTimestamp} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Initialization Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Timestamp unixTimestamp={extension.initializationTimestamp} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'scaledUiAmountConfig': {
            const extension = create(tokenExtension.state, ScaledUiAmountConfig);
            return (
                <>
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.authority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Multiplier</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.multiplier}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>New Multiplier</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.newMultiplier}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>New Multiplier Effective Timestamp</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Timestamp unixTimestamp={extension.newMultiplierEffectiveTimestamp} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'pausableAccount': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Pausable Account</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'pausableConfig': {
            const extension = create(tokenExtension.state, PausableConfig);
            return (
                <>
                    <>
                        {extension.authority && (
                            <BaseTable.Row>
                                <BaseTable.Cell>Authority</BaseTable.Cell>
                                <BaseTable.Cell className="md:text-right">
                                    <Address pubkey={extension.authority} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}
                        <BaseTable.Row>
                            <BaseTable.Cell>Paused</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                {extension.paused ? 'paused' : 'not paused'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </>
                </>
            );
        }
        case 'permissionedBurnConfig': {
            const extension = create(tokenExtension.state, PermissionedBurnConfig);
            if (extension.authority) {
                return (
                    <BaseTable.Row>
                        <BaseTable.Cell>Permissioned Burn Authority</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Address pubkey={extension.authority} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                );
            } else {
                return <></>;
            }
        }
        case 'permanentDelegate': {
            const extension = create(tokenExtension.state, PermanentDelegate);
            if (extension.delegate) {
                return (
                    <BaseTable.Row>
                        <BaseTable.Cell>Permanent Delegate</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.programId} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Transfer Hook Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
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
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.metadataAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Metadata Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
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
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.groupAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Group Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
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
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.memberAddress} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    {extension.authority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Member Pointer Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
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
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.updateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Update Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Name</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.name}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Symbol</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.symbol}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>URI</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {getSafeExternalHref(extension.uri) ? (
                                <ExternalLink href={extension.uri}>
                                    {extension.uri}
                                    <ExternalLinkIcon className="ml-1.5 align-text-top" size={13} />
                                </ExternalLink>
                            ) : (
                                extension.uri
                            )}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.additionalMetadata?.length > 0 && (
                        <>
                            <BaseTable.Row>
                                {/*use important here as there is rule from .table-sm that affects all the underline elements*/}
                                <BaseTable.HeaderCell colSpan={2} className="mb-2 h-5 !pl-6 font-normal italic">
                                    Additional Metadata
                                </BaseTable.HeaderCell>
                            </BaseTable.Row>
                            {extension.additionalMetadata?.map(keyValuePair => (
                                <BaseTable.Row key="{keyValuePair[0]}">
                                    <BaseTable.Cell>{keyValuePair[0]}</BaseTable.Cell>
                                    <BaseTable.Cell className="md:text-right">{keyValuePair[1]}</BaseTable.Cell>
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
                    <BaseTable.Cell className="md:text-right">
                        {extension.lockCpi ? 'enabled' : 'disabled'}
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'confidentialTransferAccount': {
            const extension = create(tokenExtension.state, ConfidentialTransferAccount);
            return (
                <>
                    <BaseTable.Row>
                        <BaseTable.Cell>Status</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {!extension.approved && 'not '}approved
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Elgamal Pubkey</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.elgamalPubkey}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Confidential Credits</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.allowConfidentialCredits ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Non-confidential Credits</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.allowNonConfidentialCredits ? 'enabled' : 'disabled'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Available Balance</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.availableBalance}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Decryptable Available Balance</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.decryptableAvailableBalance}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance, Low Bits</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.pendingBalanceLo}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance, High Bits</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.pendingBalanceHi}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.pendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Expected Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.expectedPendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Actual Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            {extension.actualPendingBalanceCreditCounter}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Maximum Pending Balance Credit Counter</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
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
                    <BaseTable.Cell className="md:text-right">enabled</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'memoTransfer': {
            const extension = create(tokenExtension.state, MemoTransfer);
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Require Memo on Incoming Transfers</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
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
                    <BaseTable.Cell className="md:text-right">
                        {!extension.transferring && 'not '}transferring
                    </BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'nonTransferableAccount': {
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Non-Transferable</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">enabled</BaseTable.Cell>
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
                    <BaseTable.Cell className="md:text-right">{extension.withheldAmount}</BaseTable.Cell>
                </BaseTable.Row>
            );
        }
        case 'tokenGroup': {
            const extension = create(tokenExtension.state, TokenGroup);
            return (
                <>
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {extension.updateAuthority && (
                        <BaseTable.Row>
                            <BaseTable.Cell>Update Authority</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <Address pubkey={extension.updateAuthority} alignRight link />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    )}
                    <BaseTable.Row>
                        <BaseTable.Cell>Current Size</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.size}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Max Size</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.maxSize}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'tokenGroupMember': {
            const extension = create(tokenExtension.state, TokenGroupMember);
            return (
                <>
                    <BaseTable.Row>
                        <BaseTable.Cell>Mint</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Address pubkey={extension.mint} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Group</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <Address pubkey={extension.group} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell>Member Number</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">{extension.memberNumber}</BaseTable.Cell>
                    </BaseTable.Row>
                </>
            );
        }
        case 'unparseableExtension':
        default:
            return (
                <BaseTable.Row>
                    <BaseTable.Cell>Unknown Extension</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">unparseable</BaseTable.Cell>
                </BaseTable.Row>
            );
    }
}
