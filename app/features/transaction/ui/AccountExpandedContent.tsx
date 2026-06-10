'use client';

import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { cn } from '@components/shared/utils';
import { AccountInfo, useAccountExpandedInfo } from '@entities/account';
import {
    isTokenProgramData,
    isUpgradeableLoaderAccountData,
    ParsedData,
    StakeProgramData,
    UpgradeableLoaderAccountData,
} from '@providers/accounts';

type StakeAccount = StakeProgramData['parsed'];
import { RawDataField } from '@shared/RawDataField';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { PublicKey } from '@solana/web3.js';
import { ParsedAddressLookupTableAccount } from '@validators/accounts/address-lookup-table';
import { NonceAccount } from '@validators/accounts/nonce';
import { MintAccountInfo, MultisigAccountInfo, TokenAccountInfo } from '@validators/accounts/token';
import { ProgramAccountInfo } from '@validators/accounts/upgradeable-program';
import { VoteAccount } from '@validators/accounts/vote';
import { capitalCase } from 'change-case';
import React from 'react';
import { Code, Info } from 'react-feather';

// ── Layout primitives ─────────────────────────────────────────────────────────

type DetailRowProps = {
    children: React.ReactNode;
    className?: string;
    label: string;
};

function DetailRow({ children, className, label }: DetailRowProps) {
    return (
        <div
            className={cn(
                'e-grid e-grid-cols-[clamp(100px,25%,200px)_1fr] e-items-baseline e-gap-2 e-py-1.5 e-pr-3 md:e-pr-4',
                className,
            )}
        >
            <div className="e-text-sm e-text-outer-space-300">{label}</div>
            <div className="e-text-sm">{children}</div>
        </div>
    );
}

function AddressRow({ label, value }: { label: string; value: PublicKey | string | undefined }) {
    if (!value) return undefined;
    const pubkey = typeof value === 'string' ? new PublicKey(value) : value;
    return (
        <DetailRow label={label}>
            <Address pubkey={pubkey} link />
        </DetailRow>
    );
}

// ── Type-specific sections ────────────────────────────────────────────────────

function TokenAccountSection({ info }: { info: TokenAccountInfo }) {
    return (
        <>
            <AddressRow label="Mint" value={info.mint} />
            <AddressRow label="Owner" value={info.owner} />
            <DetailRow label="Token Balance">{info.tokenAmount.uiAmountString}</DetailRow>
            <DetailRow label="Status">
                <span
                    className={cn(
                        info.state === 'frozen' && 'e-text-warning',
                        info.state === 'initialized' && 'e-text-success',
                    )}
                >
                    {capitalCase(info.state)}
                </span>
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

function MintAccountSection({ info }: { info: MintAccountInfo }) {
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

function MultisigAccountSection({ info }: { info: MultisigAccountInfo }) {
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

function UpgradeableLoaderSection({ data }: { data: UpgradeableLoaderAccountData }) {
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

function StakeAccountSection({ account }: { account: StakeAccount }) {
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

function VoteAccountSection({ account }: { account: VoteAccount }) {
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

function NonceAccountSection({ account }: { account: NonceAccount }) {
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

function AddressLookupTableSection({ account }: { account: ParsedAddressLookupTableAccount }) {
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

function ParsedSection({ parsed }: { parsed: ParsedData }) {
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

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
    accountInfo?: AccountInfo;
    accountInfoLoading?: boolean;
    address: string;
    enabled: boolean;
};

export function AccountExpandedContent({ accountInfo, accountInfoLoading, address, enabled }: Props) {
    const { data, isError, isLoading } = useAccountExpandedInfo(address, enabled);

    if (enabled && isLoading) {
        return <div className="e-ml-10 e-px-3 e-py-3 e-text-sm e-text-outer-space-300 md:e-px-4">Loading…</div>;
    }

    if (enabled && isError) {
        return (
            <div className="e-ml-10 e-px-3 e-py-3 e-text-sm e-text-outer-space-300 md:e-px-4">
                Failed to load account info
            </div>
        );
    }

    if (!data) return undefined;

    const dataSizeCell =
        accountInfo && accountInfo.size > 0 ? (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="e-h-auto !e-p-1 !e-text-sm">
                        <Code size={11} />
                        <span>{accountInfo.size.toLocaleString('en-US')} byte(s)</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="e-mx-4 e-w-auto !e-rounded-lg e-border-none e-p-0" align="end">
                    <RawDataField data={accountInfo.data} filename={address} loading={accountInfoLoading} />
                </PopoverContent>
            </Popover>
        ) : (
            <span>{(data.space ?? 0).toLocaleString('en-US')} byte(s)</span>
        );

    return (
        <div className="e-ml-14 e-pb-2.5">
            {data.data.parsed && <ParsedSection parsed={data.data.parsed} />}
            <DetailRow label="Assigned Program Id">
                <Address pubkey={data.owner} link />
            </DetailRow>
            <DetailRow label="Allocated Data Size">{dataSizeCell}</DetailRow>
            <DetailRow label="Executable">{data.executable ? 'Yes' : 'No'}</DetailRow>
            <DetailRow label="Balance">
                <SolBalance lamports={data.lamports} />
            </DetailRow>

            <div className="e-mt-3 e-flex e-items-center e-gap-1.5 e-text-xs e-text-outer-space-300">
                <Info size={13} />
                <span>Current account data. This data may have been different at the time of the transaction.</span>
            </div>
        </div>
    );
}
