import { Copyable } from '@components/common/Copyable';
import { ErrorCard } from '@components/common/ErrorCard';
import { TableCardBody } from '@components/common/TableCardBody';
import { useCluster } from '@providers/cluster';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import { AccountInfo, useAccountsInfo } from '@utils/use-accounts-info';
import React, { useMemo } from 'react';

import { toHex } from '@/app/shared/lib/bytes';

import { AddressFromLookupTableWithContext, AddressWithContext } from './AddressWithContext';

export function AccountsCard({ message }: { message: VersionedMessage }) {
    const [expanded, setExpanded] = React.useState(true);
    const { url } = useCluster();

    const pubkeys = useMemo(() => message.staticAccountKeys, [message.staticAccountKeys]);
    const { accounts, loading } = useAccountsInfo(pubkeys, url);

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
        [accounts]
    );

    if (error) {
        return <ErrorCard text={`Unable to display accounts. ${error}`} />;
    }

    return (
        <div className="card">
            <div className={`card-header ${!expanded ? 'border-0' : ''}`}>
                <h3 className="card-header-title">{`Account List (${numAccounts})`}</h3>
                <button
                    className={`btn btn-sm d-flex ${expanded ? 'btn-black active' : 'btn-white'}`}
                    onClick={() => setExpanded(current => !current)}
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>
            {expanded && (
                <>
                    <TableCardBody>{accountRows}</TableCardBody>
                    {!loading && totalAccountSize > 0 && (
                        <div className="card-footer">
                            <div className="e-flex e-items-center e-justify-end">
                                <span className="text-muted e-me-2 e-text-[0.625rem] e-uppercase">
                                    Total Account Size:
                                </span>
                                <span className="text-white">{totalAccountSize.toLocaleString('en-US')} bytes</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
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
        <tr>
            <td>
                <div className="d-flex align-items-start flex-column">
                    Account #{accountIndex + 1}
                    <span className="mt-1">
                        {!readOnly && <span className="badge bg-danger-soft me-1">Writable</span>}
                        <span className="badge bg-gray-soft">Address Table Lookup</span>
                    </span>
                </div>
            </td>
            <td className="text-lg-end">
                <AddressFromLookupTableWithContext
                    lookupTableKey={lookupTableKey}
                    lookupTableIndex={lookupTableIndex}
                />
            </td>
        </tr>
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
    const hexData = accountInfo ? toHex(accountInfo.data as Uint8Array) : null;

    return (
        <tr>
            <td>
                <div className="d-flex align-items-start flex-column">
                    Account #{accountIndex + 1}
                    <span className="mt-1">
                        {signer && <span className="badge bg-info-soft me-1">Signer</span>}
                        {!readOnly && <span className="badge bg-danger-soft me-1">Writable</span>}
                        {loading ? (
                            <span className="text-muted">Loading...</span>
                        ) : accountInfo ? (
                            <Copyable text={hexData}>
                                <span className="text-muted">{accountInfo.size.toLocaleString('en-US')} bytes</span>
                            </Copyable>
                        ) : null}
                    </span>
                </div>
            </td>
            <td className="text-lg-end">
                <AddressWithContext pubkey={publicKey} />
            </td>
        </tr>
    );
}
