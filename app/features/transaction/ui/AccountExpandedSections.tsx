import {
    isTokenProgramData,
    isUpgradeableLoaderAccountData,
    ParsedData,
    StakeProgramData,
    UpgradeableLoaderAccountData,
} from '@providers/accounts';
import { ParsedAddressLookupTableAccount } from '@validators/accounts/address-lookup-table';
import { NonceAccount } from '@validators/accounts/nonce';
import { MintAccountInfo, MultisigAccountInfo, TokenAccountInfo } from '@validators/accounts/token';
import { ProgramAccountInfo } from '@validators/accounts/upgradeable-program';
import { VoteAccount } from '@validators/accounts/vote';
import { capitalCase } from 'change-case';
import React from 'react';

import { StatusBadge } from '@/app/components/account/TokenAccountSection';

import { AddressRow, DetailRow } from './AccountExpandedLayout';

type StakeAccount = StakeProgramData['parsed'];

export function TokenAccountSection({ info }: { info: TokenAccountInfo }) {
    return (
        <>
            <AddressRow label="Mint" value={info.mint} />
            <AddressRow label="Owner" value={info.owner} />
            <DetailRow label="Token Balance">{info.tokenAmount.uiAmountString}</DetailRow>
            {/* "active" = account can transfer tokens; "inactive" = frozen by the mint's freeze authority */}
            <DetailRow label="Status">
                <StatusBadge status={info.state} />
            </DetailRow>
            {info.isNative && <DetailRow label="Native Wrapped SOL">Yes</DetailRow>}
            {info.rentExemptReserve && (
                <DetailRow label="Rent-Exempt Reserve">{info.rentExemptReserve.uiAmountString}</DetailRow>
            )}
            <AddressRow label="Delegate" value={info.delegate} />
            {info.delegatedAmount && (
                <DetailRow label="Delegated Amount">{info.delegatedAmount.uiAmountString}</DetailRow>
            )}
            <AddressRow label="Close Authority" value={info.closeAuthority} />
        </>
    );
}

export function MintAccountSection({ info }: { info: MintAccountInfo }) {
    return (
        <>
            <DetailRow label="Supply">{info.supply}</DetailRow>
            <DetailRow label="Decimals">{info.decimals}</DetailRow>
            {info.mintAuthority !== null ? (
                <AddressRow label="Mint Authority" value={info.mintAuthority} />
            ) : (
                <DetailRow label="Mint Authority">Fixed supply</DetailRow>
            )}
            {info.freezeAuthority !== null ? (
                <AddressRow label="Freeze Authority" value={info.freezeAuthority} />
            ) : (
                <DetailRow label="Freeze Authority">None</DetailRow>
            )}
            {!info.isInitialized && <DetailRow label="Status">Uninitialized</DetailRow>}
        </>
    );
}

export function MultisigAccountSection({ info }: { info: MultisigAccountInfo }) {
    return (
        <>
            <DetailRow label="Required Signers">{info.numRequiredSigners}</DetailRow>
            <DetailRow label="Valid Signers">{info.numValidSigners}</DetailRow>
            {info.signers.map((signer, i) => (
                <AddressRow key={signer.toBase58()} label={`Signer ${i + 1}`} value={signer} />
            ))}
        </>
    );
}

export function UpgradeableLoaderSection({ data }: { data: UpgradeableLoaderAccountData }) {
    const account = data.parsed;
    if (account.type === 'program') {
        const programAccount = account.info as unknown as ProgramAccountInfo;
        return (
            <>
                <AddressRow label="Program Data" value={programAccount.programData} />
                {data.programData && (
                    <>
                        {data.programData.authority !== null ? (
                            <AddressRow label="Upgrade Authority" value={data.programData.authority} />
                        ) : (
                            <DetailRow label="Upgrade Authority">Immutable</DetailRow>
                        )}
                        {data.programData.slot > 0 && (
                            <DetailRow label="Last Deploy Slot">
                                {data.programData.slot.toLocaleString('en-US')}
                            </DetailRow>
                        )}
                    </>
                )}
            </>
        );
    }
    if (account.type === 'programData') {
        return (
            <>
                {account.info.authority !== null ? (
                    <AddressRow label="Upgrade Authority" value={account.info.authority} />
                ) : (
                    <DetailRow label="Upgrade Authority">Immutable</DetailRow>
                )}
                {account.info.slot > 0 && (
                    <DetailRow label="Last Deploy Slot">{account.info.slot.toLocaleString('en-US')}</DetailRow>
                )}
            </>
        );
    }
    if (account.type === 'buffer') {
        return account.info.authority !== null ? (
            <AddressRow label="Buffer Authority" value={account.info.authority} />
        ) : undefined;
    }
    return undefined;
}

export function StakeAccountSection({ account }: { account: StakeAccount }) {
    const { type, info } = account;
    return (
        <>
            <DetailRow label="Stake Type">{capitalCase(type)}</DetailRow>
            <AddressRow label="Staker Authority" value={info.meta.authorized.staker} />
            <AddressRow label="Withdrawer Authority" value={info.meta.authorized.withdrawer} />
            {info.stake && (
                <>
                    <AddressRow label="Vote Account" value={info.stake.delegation.voter} />
                    <DetailRow label="Activation Epoch">{info.stake.delegation.activationEpoch.toString()}</DetailRow>
                    {info.stake.delegation.deactivationEpoch.toString() !== '18446744073709551615' && (
                        <DetailRow label="Deactivation Epoch">
                            {info.stake.delegation.deactivationEpoch.toString()}
                        </DetailRow>
                    )}
                </>
            )}
        </>
    );
}

export function VoteAccountSection({ account }: { account: VoteAccount }) {
    const { info } = account;
    return (
        <>
            <AddressRow label="Node Pubkey" value={info.nodePubkey} />
            <AddressRow label="Authorized Withdrawer" value={info.authorizedWithdrawer} />
            <DetailRow label="Commission">{info.commission}%</DetailRow>
            {info.authorizedVoters.length > 0 && (
                <AddressRow label="Authorized Voter" value={info.authorizedVoters[0].authorizedVoter} />
            )}
        </>
    );
}

export function NonceAccountSection({ account }: { account: NonceAccount }) {
    if (account.type === 'uninitialized') {
        return <DetailRow label="Status">Uninitialized</DetailRow>;
    }
    return (
        <>
            <AddressRow label="Nonce Authority" value={account.info.authority} />
            <DetailRow label="Nonce">{account.info.blockhash}</DetailRow>
            <DetailRow label="Fee (lamports/sig)">{account.info.feeCalculator.lamportsPerSignature}</DetailRow>
        </>
    );
}

export function AddressLookupTableSection({ account }: { account: ParsedAddressLookupTableAccount }) {
    const { info } = account;
    return (
        <>
            {info.authority !== undefined ? (
                <AddressRow label="Authority" value={info.authority} />
            ) : (
                <DetailRow label="Authority">Frozen</DetailRow>
            )}
            <DetailRow label="Last Extended Slot">{info.lastExtendedSlot.toLocaleString('en-US')}</DetailRow>
            <DetailRow label="Addresses">{info.addresses.length} address(es)</DetailRow>
        </>
    );
}

export function ParsedSection({ parsed }: { parsed: ParsedData }) {
    if (isTokenProgramData(parsed)) {
        const account = parsed.parsed;
        if (account.type === 'account') {
            return <TokenAccountSection info={account.info as TokenAccountInfo} />;
        }
        if (account.type === 'mint') {
            return <MintAccountSection info={account.info as MintAccountInfo} />;
        }
        if (account.type === 'multisig') {
            return <MultisigAccountSection info={account.info as MultisigAccountInfo} />;
        }
        return undefined;
    }
    if (isUpgradeableLoaderAccountData(parsed)) {
        return <UpgradeableLoaderSection data={parsed} />;
    }
    if (parsed.program === 'stake') {
        return <StakeAccountSection account={parsed.parsed} />;
    }
    if (parsed.program === 'vote') {
        return <VoteAccountSection account={parsed.parsed} />;
    }
    if (parsed.program === 'nonce') {
        return <NonceAccountSection account={parsed.parsed} />;
    }
    if (parsed.program === 'address-lookup-table') {
        return <AddressLookupTableSection account={parsed.parsed} />;
    }
    return undefined;
}
