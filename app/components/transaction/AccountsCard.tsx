import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { HexData } from '@components/common/HexData';
import { SolBalance } from '@components/common/SolBalance';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { PublicKey } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import { Buffer } from 'buffer';
import React, { useEffect, useState } from 'react';
import { Code } from 'react-feather';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url: clusterUrl } = useCluster();
    const [showRaw, setShowRaw] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [accountSizes, setAccountSizes] = useState<Map<string, number>>(new Map());

    const transactionWithMeta = details?.data?.transactionWithMeta;
    if (!transactionWithMeta) {
        return null;
    }

    const { meta, transaction } = transactionWithMeta;
    const { message } = transaction;

    if (!meta) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    // Fetch account info for all accounts to get their sizes
    useEffect(() => {
        const fetchSizes = async () => {
            const { Connection } = await import('@solana/web3.js');
            const connection = new Connection(clusterUrl);
            const sizes = new Map<string, number>();

            for (const account of message.accountKeys) {
                const pubkey = account.pubkey;
                try {
                    const info = await connection.getAccountInfo(pubkey);
                    if (info) {
                        sizes.set(pubkey.toBase58(), info.data.length);
                    }
                } catch (err) {
                    console.error('Failed to fetch account info for', pubkey.toBase58(), err);
                }
            }

            setAccountSizes(sizes);
        };

        fetchSizes();
    }, [message.accountKeys, clusterUrl]);

    const totalAccountSize = Array.from(accountSizes.values()).reduce((sum, size) => sum + size, 0);
    const totalAccountSizeFormatted = `${totalAccountSize.toLocaleString('en-US')} bytes`;

    const accountRows = message.accountKeys.map((account, index) => {
        const pre = meta.preBalances[index];
        const post = meta.postBalances[index];
        const pubkey = account.pubkey;
        const key = account.pubkey.toBase58();
        const delta = new BigNumber(post).minus(new BigNumber(pre));
        const accountSize = accountSizes.get(key);

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
                    {accountSize !== undefined ? (
                        <span>{accountSize.toLocaleString('en-US')}</span>
                    ) : (
                        <span className="text-muted">Loading...</span>
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
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">{`Account Input(s) (${message.accountKeys.length}) - Total Account Size: ${totalAccountSizeFormatted}`}</h3>
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
                        <RawAccountsView accountKeys={message.accountKeys} accountSizes={accountSizes} />
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
                                        <p className="text-muted e-m-0 e-uppercase">Total Account Size:</p>
                                    </td>
                                    <td>
                                        <span className="text-white">{totalAccountSizeFormatted}</span>
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

function RawAccountsView({ accountKeys, accountSizes }: { accountKeys: { pubkey: PublicKey }[], accountSizes: Map<string, number> }) {
    const { url: clusterUrl } = useCluster();
    const [accountsData, setAccountsData] = useState<Map<string, Buffer>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccountsData = async () => {
            setLoading(true);
            const { Connection } = await import('@solana/web3.js');
            const connection = new Connection(clusterUrl);
            const dataMap = new Map<string, Buffer>();

            for (const account of accountKeys) {
                const pubkey = account.pubkey;
                try {
                    const info = await connection.getAccountInfo(pubkey);
                    if (info && info.data) {
                        dataMap.set(
                            pubkey.toBase58(),
                            info.data instanceof Buffer ? info.data : Buffer.from(info.data)
                        );
                    }
                } catch (err) {
                    console.error('Failed to fetch account data for', pubkey.toBase58(), err);
                }
            }

            setAccountsData(dataMap);
            setLoading(false);
        };

        fetchAccountsData();
    }, [accountKeys, clusterUrl]);

    if (loading) {
        return <div className="text-center py-4">Loading account data...</div>;
    }

    return (
        <div className="table-responsive mb-0">
            <table className="table table-sm table-nowrap card-table">
                <tbody className="list">
                    {accountKeys.map((account, index) => {
                        const key = account.pubkey.toBase58();
                        const data = accountsData.get(key);
                        const accountSize = accountSizes.get(key);

                        return <DataRow key={key} index={index} account={account} data={data} accountSize={accountSize?.toLocaleString('en-US')} />;
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
    data: Buffer | undefined;
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
                            <div className='e-flex e-flex-col'>
                                <Address pubkey={account.pubkey} link fetchTokenLabelInfo />
                                <span className='text-muted'>{accountSize} bytes</span>
                            </div>
                        </div>

                        <button
                            className={`btn btn-sm d-flex ${isDataVisible ? 'btn-black active' : 'btn-white'}`}
                            onClick={() => setIsDataVisible(!isDataVisible)}
                        >
                            {isDataVisible ? 'Hide Data' : 'See/Copy Data'}
                        </button>
                    </div>
                
                    {isDataVisible && (
                        <div className="e-items-end e-text-end">
                            {data && data.length > 0 ? (
                                <HexData raw={data} className="!e-items-baseline" />
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
