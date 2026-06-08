import { Copyable } from '@components/common/Copyable';
import { ErrorCard } from '@components/common/ErrorCard';
import { TableCardBody } from '@components/common/TableCardBody';
import { type AccountInfo, useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { CollapsibleCard } from '@shared/ui/collapsible-card';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React, { useMemo } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { toHex } from '@/app/shared/lib/bytes';
import { CardFooter } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { AddressFromLookupTableWithContext, AddressWithContext } from './AddressWithContext';

export function AccountsCard({ message }: { message: VersionedMessage }) {
    const { url } = useCluster();

    const pubkeys = useMemo(() => message.staticAccountKeys, [message.staticAccountKeys]);
    const { accounts, error: fetchError, loading } = useAccountsInfo(pubkeys, url);

    const { validMessage, error } = React.useMemo(() => {
        const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = message.header;

        if (numReadonlySignedAccounts >= numRequiredSignatures) {
            return { error: 'Invalid header', validMessage: undefined };
        } else if (numReadonlyUnsignedAccounts >= message.staticAccountKeys.length) {
            return { error: 'Invalid header', validMessage: undefined };
        } else if (message.staticAccountKeys.length === 0) {
            return { error: 'Message has no accounts', validMessage: undefined };
        }

        return {
            error: undefined,
            validMessage: message,
        };
    }, [message]);

    const { accountRows, numAccounts } = React.useMemo(() => {
        const message = validMessage;
        if (!message) return { accountRows: undefined, numAccounts: 0 };
        const staticAccountRows = message.staticAccountKeys.map((publicKey, accountIndex) => {
            const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = message.header;

            let readOnly = false;
            let signer = false;
            if (accountIndex < numRequiredSignatures) {
                signer = true;
                if (accountIndex >= numRequiredSignatures - numReadonlySignedAccounts) {
                    readOnly = true;
                }
            } else if (accountIndex >= message.staticAccountKeys.length - numReadonlyUnsignedAccounts) {
                readOnly = true;
            }

            const props = {
                accountIndex,
                accountInfo: accounts.get(publicKey.toBase58()),
                loading,
                publicKey,
                readOnly,
                signer,
            };

            return <AccountRow key={accountIndex} {...props} />;
        });

        let accountIndex = message.staticAccountKeys.length;
        const writableLookupTableRows = message.addressTableLookups.flatMap(lookup => {
            return lookup.writableIndexes.map(lookupTableIndex => {
                const props = {
                    accountIndex,
                    lookupTableIndex,
                    lookupTableKey: lookup.accountKey,
                    readOnly: false,
                };

                accountIndex += 1;
                return <AccountFromLookupTableRow key={accountIndex} {...props} />;
            });
        });

        const readonlyLookupTableRows = message.addressTableLookups.flatMap(lookup => {
            return lookup.readonlyIndexes.map(lookupTableIndex => {
                const props = {
                    accountIndex,
                    lookupTableIndex,
                    lookupTableKey: lookup.accountKey,
                    readOnly: true,
                };

                accountIndex += 1;
                return <AccountFromLookupTableRow key={accountIndex} {...props} />;
            });
        });

        return {
            accountRows: [...staticAccountRows, ...writableLookupTableRows, ...readonlyLookupTableRows],
            numAccounts: accountIndex,
        };
    }, [accounts, loading, validMessage]);

    const totalAccountSize = React.useMemo(
        () => Array.from(accounts.values()).reduce((acc, account) => acc + account.size, 0),
        [accounts],
    );

    if (fetchError) {
        return <ErrorCard text="Failed to fetch accounts info" />;
    }

    if (error) {
        return <ErrorCard text={`Unable to display accounts. ${error}`} />;
    }

    return (
        <CollapsibleCard title={`Account List (${numAccounts})`}>
            <TableCardBody>{accountRows}</TableCardBody>
            {!loading && totalAccountSize > 0 && (
                <CardFooter ui="dashkit">
                    <div className="e-flex e-items-baseline e-justify-end">
                        <span className="text-muted e-me-2 e-text-[0.625rem] e-uppercase">Total Account Size:</span>
                        <span className="e-text-white">{totalAccountSize.toLocaleString('en-US')} bytes</span>
                    </div>
                </CardFooter>
            )}
        </CollapsibleCard>
    );
}

function AccountFromLookupTableRow({
    accountIndex,
    lookupTableKey,
    lookupTableIndex,
    readOnly,
}: {
    accountIndex: number;
    lookupTableKey: PublicKey;
    lookupTableIndex: number;
    readOnly: boolean;
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <div className="e-flex e-flex-col e-items-start">
                    Account #{accountIndex + 1}
                    <span className="e-mt-[3px]">
                        {!readOnly && (
                            <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                                Writable
                            </Badge>
                        )}
                        <Badge ui="dashkit" variant="gray">
                            Address Table Lookup
                        </Badge>
                    </span>
                </div>
            </BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">
                <AddressFromLookupTableWithContext
                    lookupTableKey={lookupTableKey}
                    lookupTableIndex={lookupTableIndex}
                />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

function AccountRow({
    accountIndex,
    accountInfo,
    loading,
    publicKey,
    signer,
    readOnly,
}: {
    accountIndex: number;
    accountInfo: AccountInfo | undefined;
    loading: boolean;
    publicKey: PublicKey;
    signer: boolean;
    readOnly: boolean;
}) {
    const hexData = accountInfo ? toHex(accountInfo.data) : null;

    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <div className="e-flex e-flex-col e-items-start">
                    Account #{accountIndex + 1}
                    <span className="e-mt-[3px]">
                        {signer && (
                            <Badge ui="dashkit" variant="info" className="e-mr-[3px]">
                                Signer
                            </Badge>
                        )}
                        {!readOnly && (
                            <Badge ui="dashkit" variant="destructive" className="e-mr-[3px]">
                                Writable
                            </Badge>
                        )}
                        {loading ? (
                            <span className="text-muted">Loading...</span>
                        ) : accountInfo ? (
                            <Copyable text={hexData}>
                                <span className="text-muted">{accountInfo.size.toLocaleString('en-US')} bytes</span>
                            </Copyable>
                        ) : null}
                    </span>
                </div>
            </BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">
                <AddressWithContext pubkey={publicKey} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
