import { Address } from '@components/common/Address';
import { CollapsibleCard } from '@components/shared/ui/collapsible-card';
import { useAddressLookupTable } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { BaseTable } from '@/app/shared/ui/Table';

export function AddressTableLookupsCard({ message }: { message: VersionedMessage }) {
    const lookupRows = React.useMemo(() => {
        let key = 0;
        return message.addressTableLookups.flatMap(lookup => {
            const indexes = [
                ...lookup.writableIndexes.map(index => ({ index, readOnly: false })),
                ...lookup.readonlyIndexes.map(index => ({ index, readOnly: true })),
            ];

            indexes.sort((a, b) => (a.index < b.index ? -1 : 1));

            return indexes.map(({ index, readOnly }) => {
                const props = {
                    lookupTableIndex: index,
                    lookupTableKey: lookup.accountKey,
                    readOnly,
                };
                return <LookupRow key={key++} {...props} />;
            });
        });
    }, [message]);

    if (message.version === 'legacy') return null;

    return (
        <CollapsibleCard title="Address Table Lookup(s)">
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-dk-gray-700">
                            Address Lookup Table Address
                        </BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Table Index</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Resolved Address</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Details</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                {lookupRows.length > 0 ? (
                    <BaseTable.Body>{lookupRows}</BaseTable.Body>
                ) : (
                    <BaseTable.Body className="border-0 border-t border-solid border-dark-border px-dk-4 py-4">
                        <BaseTable.Row>
                            <BaseTable.Cell colSpan={4}>
                                <span className="text-center text-dk-gray-700">No entries found</span>
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </BaseTable.Body>
                )}
            </BaseTable>
        </CollapsibleCard>
    );
}

function LookupRow({
    lookupTableKey,
    lookupTableIndex,
    readOnly,
}: {
    lookupTableKey: PublicKey;
    lookupTableIndex: number;
    readOnly: boolean;
}) {
    const lookupTableInfo = useAddressLookupTable(lookupTableKey.toBase58());

    const loadingComponent = (
        <span className="text-dk-gray-700">
            <span className="spinner-grow spinner-grow-sm mr-1.5"></span>
            Loading
        </span>
    );

    let resolvedKeyComponent;
    if (!lookupTableInfo) {
        resolvedKeyComponent = loadingComponent;
    } else {
        const [lookupTable, status] = lookupTableInfo;
        if (status === FetchStatus.Fetching) {
            resolvedKeyComponent = loadingComponent;
        } else if (status === FetchStatus.FetchFailed || !lookupTable) {
            resolvedKeyComponent = <span className="text-dk-gray-700">Failed to fetch Lookup Table</span>;
        } else if (typeof lookupTable === 'string') {
            resolvedKeyComponent = <span className="text-dk-gray-700">Invalid Lookup Table</span>;
        } else if (lookupTableIndex >= lookupTable.state.addresses.length) {
            resolvedKeyComponent = <span className="text-dk-gray-700">Invalid Lookup Table Index</span>;
        } else {
            const resolvedKey = lookupTable.state.addresses[lookupTableIndex];
            resolvedKeyComponent = <Address pubkey={resolvedKey} link />;
        }
    }

    return (
        <BaseTable.Row>
            <BaseTable.Cell className="text-right">
                <Address pubkey={lookupTableKey} link />
            </BaseTable.Cell>
            <BaseTable.Cell className="text-right">{lookupTableIndex}</BaseTable.Cell>
            <BaseTable.Cell className="text-right">{resolvedKeyComponent}</BaseTable.Cell>
            <BaseTable.Cell>
                {!readOnly && (
                    <Badge ui="dashkit" variant="destructive" className="mr-[3px]">
                        Writable
                    </Badge>
                )}
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
