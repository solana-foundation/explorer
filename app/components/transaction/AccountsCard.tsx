import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { RawDataField } from '@shared/RawDataField';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { Code } from 'react-feather';

import { BaseTable } from '@/app/shared/ui/Table';

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
            <BaseTable.Row key={key}>
                <BaseTable.Cell>{index + 1}</BaseTable.Cell>
                <BaseTable.Cell>
                    <Address pubkey={pubkey} link fetchTokenLabelInfo />
                </BaseTable.Cell>
                <BaseTable.Cell>
                    <BalanceDelta delta={delta} isSol />
                </BaseTable.Cell>
                <BaseTable.Cell>
                    <SolBalance lamports={post} />
                </BaseTable.Cell>
                <BaseTable.Cell>
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
                </BaseTable.Cell>
                <BaseTable.Cell>
                    {index === 0 && (
                        <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                            Fee Payer
                        </Badge>
                    )}
                    {account.signer && (
                        <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                            Signer
                        </Badge>
                    )}
                    {account.writable && (
                        <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                            Writable
                        </Badge>
                    )}
                    {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
                        <Badge ui="dashkit" variant="warning" className="e-mr-[3px]">
                            Program
                        </Badge>
                    )}
                    {account.source === 'lookupTable' && (
                        <Badge ui="dashkit" variant="gray" className="e-mr-[3px]">
                            Address Table Lookup
                        </Badge>
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>
        );
    });

    return (
        <CollapsibleCard title={`Account Input(s) (${message.accountKeys.length})`}>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted">#</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Address</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Change (SOL)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Post Balance (SOL)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Size (bytes)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Details</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">{accountRows}</BaseTable.Body>
                {totalAccountSize > 0 && (
                    <tfoot>
                        <BaseTable.Row>
                            <BaseTable.Cell colSpan={3} className="e-align-bottom">
                                <p className="text-muted e-m-0 e-text-right e-text-[0.625rem]">
                                    reflects current account state
                                </p>
                            </BaseTable.Cell>
                            <BaseTable.Cell className="e-align-bottom">
                                <p className="text-muted e-m-0 e-text-[0.625rem] e-uppercase">Total Account Size:</p>
                            </BaseTable.Cell>
                            <BaseTable.Cell>
                                <span className="e-ml-7 e-text-white">{totalAccountSize.toLocaleString('en-US')}</span>
                            </BaseTable.Cell>
                            <BaseTable.Cell />
                        </BaseTable.Row>
                    </tfoot>
                )}
            </BaseTable>
        </CollapsibleCard>
    );
}
