import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { Copyable } from '@components/common/Copyable';
import { ErrorCard } from '@components/common/ErrorCard';
import { HexData } from '@components/common/HexData';
import { SolBalance } from '@components/common/SolBalance';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { PublicKey } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { AccountInfo, useAccountsInfo } from '@utils/use-accounts-info';
import { BigNumber } from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { Code } from 'react-feather';

import { ByteArray, toHex } from '@/app/shared/lib/bytes';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    const [showRaw, setShowRaw] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    const pubkeys = useMemo(() => message?.accountKeys.map(a => a.pubkey) ?? [], [message?.accountKeys]);

    const { accounts, loading } = useAccountsInfo(pubkeys, url);

    if (!transactionWithMeta) {
        return null;
    }

    if (!meta) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    const totalAccountSize = Array.from(accounts.values()).reduce((acc, account) => acc + account.size, 0);

    const accountRows = message!.accountKeys.map((account, index) => {
        const pre = meta.preBalances[index];
        const post = meta.postBalances[index];
        const pubkey = account.pubkey;
        const key = pubkey.toBase58();
        const delta = new BigNumber(post).minus(new BigNumber(pre));
        const accountInfo = accounts.get(key);
        const hexData = accountInfo ? toHex(accountInfo.data as Uint8Array) : null;

        return (
            <tr key={key}>
                <td>{index + 1}</td>
                <td>
                    <Address pubkey={pubkey} link fetchTokenLabelInfo />
                </td>
                <td>
                    <BalanceDelta delta={delta} isSol />
                </td>
                <td>
                    <SolBalance lamports={post} />
                </td>
                <td>
                    {loading ? (
                        <span className="text-muted">Loading...</span>
                    ) : accountInfo ? (
                        <Copyable text={hexData}>
                            <span>{accountInfo.size.toLocaleString('en-US')}</span>
                        </Copyable>
                    ) : (
                        <span className="text-muted">-</span>
                    )}
                </td>
                <td>
                    {index === 0 && <span className="badge bg-info-soft me-1">Fee Payer</span>}
                    {account.signer && <span className="badge bg-info-soft me-1">Signer</span>}
                    {account.writable && <span className="badge bg-danger-soft me-1">Writable</span>}
                    {message!.instructions.find(ix => ix.programId.equals(pubkey)) && (
                        <span className="badge bg-warning-soft me-1">Program</span>
                    )}
                    {account.source === 'lookupTable' && (
                        <span className="badge bg-gray-soft me-1">Address Table Lookup</span>
                    )}
                </td>
            </tr>
        );
    });

    return (
        <div className="card">
            <div className={`card-header ${!expanded ? 'border-0' : ''}`}>
                <h3 className="card-header-title">{`Account Input(s) (${message!.accountKeys.length})`}</h3>
                <button
                    className={`btn btn-sm d-flex align-items-center ${
                        showRaw ? 'btn-black active' : 'btn-white'
                    } me-2`}
                    onClick={() => setShowRaw(r => !r)}
                >
                    <Code className="me-2" size={13} /> Raw
                </button>
                <button
                    className={`btn btn-sm d-flex ${expanded ? 'btn-black active' : 'btn-white'}`}
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>
            {expanded &&
                (showRaw ? (
                    <div className="card-body">
                        <RawAccountsView accountKeys={message!.accountKeys} accounts={accounts} loading={loading} />
                    </div>
                ) : (
                    <div className="table-responsive mb-0">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="text-muted">#</th>
                                    <th className="text-muted">Address</th>
                                    <th className="text-muted">Change (SOL)</th>
                                    <th className="text-muted">Post Balance (SOL)</th>
                                    <th className="text-muted">Size (bytes)</th>
                                    <th className="text-muted">Details</th>
                                </tr>
                            </thead>
                            <tbody className="list">{accountRows}</tbody>
                            {totalAccountSize > 0 && (
                                <tr>
                                    <td colSpan={3} />
                                    <td>
                                        <p className="text-muted e-m-0 e-text-[0.625rem] e-uppercase">
                                            Total Account Size:
                                        </p>
                                    </td>
                                    <td>
                                        <span className="text-white">{totalAccountSize.toLocaleString('en-US')}</span>
                                    </td>
                                    <td />
                                </tr>
                            )}
                        </table>
                    </div>
                ))}
        </div>
    );
}

function RawAccountsView({
    accountKeys,
    accounts,
    loading,
}: {
    accountKeys: { pubkey: PublicKey }[];
    accounts: Map<string, AccountInfo>;
    loading: boolean;
}) {
    if (loading) {
        return <div className="text-center py-4">Loading account data...</div>;
    }

    return (
        <div className="table-responsive mb-0">
            <table className="table table-sm table-nowrap card-table">
                <tbody className="list">
                    {accountKeys.map((account, index) => {
                        const key = account.pubkey.toBase58();
                        const info = accounts.get(key);

                        return (
                            <DataRow
                                key={key}
                                index={index}
                                account={account}
                                data={info?.data}
                                accountSize={info?.size.toLocaleString('en-US')}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function DataRow({
    index,
    account,
    data,
    accountSize,
}: {
    index: number;
    account: { pubkey: PublicKey };
    data: ByteArray | undefined;
    accountSize: string | undefined;
}) {
    const [isDataVisible, setIsDataVisible] = useState(false);

    return (
        <tr>
            <td>
                <div className="e-flex e-flex-col e-gap-3">
                    <div className="e-flex e-items-center e-justify-between">
                        <div className="e-flex e-items-start">
                            <span className="badge bg-info-soft e-me-2">#{index + 1}</span>
                            <div className="e-flex e-flex-col">
                                <Address pubkey={account.pubkey} link fetchTokenLabelInfo />
                                <span className="text-muted">{accountSize} bytes</span>
                            </div>
                        </div>

                        <button
                            className={`btn btn-sm d-flex ${isDataVisible ? 'btn-black active' : 'btn-white'}`}
                            onClick={() => setIsDataVisible(!isDataVisible)}
                        >
                            {isDataVisible ? 'Hide Data' : 'Show Data'}
                        </button>
                    </div>

                    {isDataVisible && (
                        <div className="e-items-end e-text-end">
                            {data && data.length > 0 ? (
                                <HexData raw={data as Buffer} className="!e-items-baseline" />
                            ) : (
                                <span className="text-muted">No data</span>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}
