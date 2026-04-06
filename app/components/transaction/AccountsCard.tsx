import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { HexData } from '@components/common/HexData';
import { SolBalance } from '@components/common/SolBalance';
import { type AccountInfo, useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { Button } from '@shared/ui/button';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { cn } from '@shared/utils';
import { PublicKey } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo, useState } from 'react';
import { Code, Download } from 'react-feather';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { ByteArray } from '@/app/shared/lib/bytes';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    const [showRaw, setShowRaw] = useState(false);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    const pubkeys = useMemo(() => message?.accountKeys.map(a => a.pubkey) ?? [], [message?.accountKeys]);

    const { accounts, error, loading } = useAccountsInfo(pubkeys, url);

    if (!transactionWithMeta) {
        return null;
    }

    if (!meta || !message) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    if (error) {
        return <ErrorCard text="Failed to fetch accounts info" />;
    }

    const totalAccountSize = Array.from(accounts.values()).reduce((acc, account) => acc + account.size, 0);

    const accountRows = message.accountKeys.map((account, index) => {
        const pre = meta.preBalances[index];
        const post = meta.postBalances[index];
        const pubkey = account.pubkey;
        const key = pubkey.toBase58();
        const delta = new BigNumber(post).minus(new BigNumber(pre));
        const accountInfo = accounts.get(key);
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
                        accountInfo.size > 0 ? (
                            <div className="e-flex e-items-center">
                                <DownloadDropdown data={accountInfo.data} encodings={['hex', 'base64']} filename={key}>
                                    <Button variant="ghost" size="icon">
                                        <Download size={12} />
                                    </Button>
                                </DownloadDropdown>
                                <span>{accountInfo.size.toLocaleString('en-US')}</span>
                            </div>
                        ) : (
                            <span className="e-ml-7">{accountInfo.size.toLocaleString('en-US')}</span>
                        )
                    ) : (
                        <span className="text-muted e-ml-7">-</span>
                    )}
                </td>
                <td>
                    {index === 0 && <span className="badge bg-info-soft me-1">Fee Payer</span>}
                    {account.signer && <span className="badge bg-info-soft me-1">Signer</span>}
                    {account.writable && <span className="badge bg-danger-soft me-1">Writable</span>}
                    {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
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
        <CollapsibleCard
            title={`Account Input(s) (${message.accountKeys.length})`}
            headerButtons={
                <button
                    className={cn(
                        'btn btn-sm d-flex align-items-center me-2',
                        showRaw ? 'btn-black active' : 'btn-white',
                    )}
                    onClick={() => setShowRaw(r => !r)}
                >
                    <Code className="me-2" size={13} /> Raw
                </button>
            }
        >
            {showRaw ? (
                <div className="card-body">
                    <RawAccountsView accountKeys={message.accountKeys} accounts={accounts} loading={loading} />
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
                            <tfoot>
                                <tr>
                                    <td colSpan={3} className="align-bottom">
                                        <p className="text-muted e-m-0 e-text-right e-text-[0.625rem]">
                                            reflects current account state
                                        </p>
                                    </td>
                                    <td className="align-bottom">
                                        <p className="text-muted e-m-0 e-text-[0.625rem] e-uppercase">
                                            Total Account Size:
                                        </p>
                                    </td>
                                    <td>
                                        <span className="text-white e-ml-7">
                                            {totalAccountSize.toLocaleString('en-US')}
                                        </span>
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </CollapsibleCard>
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

const MAX_DISPLAY_BYTES = 1024;

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

    const isTruncated = data && data.length > MAX_DISPLAY_BYTES;
    const displayData = data && isTruncated ? data.slice(0, MAX_DISPLAY_BYTES) : data;

    return (
        <tr>
            <td>
                <div className="e-flex e-flex-col e-gap-3">
                    <div className="e-flex e-items-center e-justify-between">
                        <div className="e-flex e-items-start">
                            <span className="badge bg-info-soft e-me-2">#{index + 1}</span>
                            <div className="e-flex e-flex-col">
                                <Address pubkey={account.pubkey} link fetchTokenLabelInfo />
                                <span className="text-muted">{accountSize ? `${accountSize} bytes` : '-'}</span>
                            </div>
                        </div>

                        <button
                            className={cn('btn btn-sm d-flex', isDataVisible ? 'btn-black active' : 'btn-white')}
                            onClick={() => setIsDataVisible(!isDataVisible)}
                        >
                            {isDataVisible ? 'Hide Data' : 'Show Data'}
                        </button>
                    </div>

                    {isDataVisible && (
                        <div className="md:e-items-end xl:e-text-end">
                            {displayData && displayData.length > 0 ? (
                                <>
                                    <HexData raw={displayData} copyableRaw={data} className="!e-items-baseline" />
                                    {isTruncated && (
                                        <span className="text-muted e-ml-5 e-mt-1 e-text-xs xl:e-ml-0">
                                            Showing first {MAX_DISPLAY_BYTES.toLocaleString()} of{' '}
                                            {data.length.toLocaleString()} bytes
                                        </span>
                                    )}
                                </>
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
