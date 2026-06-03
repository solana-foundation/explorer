import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { RawDataField } from '@shared/RawDataField';
import { Button } from '@shared/ui/button';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { Code } from 'react-feather';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();

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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost">
                                        <Code size={12} />
                                        <span>{accountInfo.size.toLocaleString('en-US')}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="e-w-auto !e-rounded-lg e-border-none e-p-0" align="end">
                                    <RawDataField data={accountInfo.data} filename={key} />
                                </PopoverContent>
                            </Popover>
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
        <CollapsibleCard title={`Account Input(s) (${message.accountKeys.length})`}>
            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
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
        </CollapsibleCard>
    );
}
