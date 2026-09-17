import { Address } from '@components/common/Address';
import { cn } from '@components/shared/utils';
import { useAddressLookupTable } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { DataListCard, DataListRow } from '@/app/shared/ui/DataListCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

// Desktop-only grid (lg+): a single 4-column row driven by the header labels. Below lg the row uses the
// mobile card layout instead — the `nowrap` table used previously overflowed narrow viewports.
const COLS = 'grid-cols-[minmax(0,1fr)_minmax(auto,90px)_minmax(0,1.4fr)_minmax(auto,90px)]';
const ROW_GRID_DESKTOP = cn(
    'hidden min-h-9 lg:grid',
    ROW_PADDING,
    'items-start gap-x-5 text-sm',
    "[grid-template-areas:'table_index_resolved_details']",
    COLS,
);
const HEADER_GRID = cn(
    'hidden gap-5 lg:grid',
    ROW_PADDING,
    COLS,
    'text-xs uppercase text-outer-space-300',
    'border-1 border-b border-white/10 [border-bottom-style:solid]',
);
// Fixed-width per-row field label for the mobile layout.
const MOBILE_LABEL = 'w-24 shrink-0 text-outer-space-300';

export const ADDRESS_TABLE_LOOKUPS_CARD_TITLE = 'Address Table Lookup(s)';

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

    // No lookups (legacy transactions, or a v0 message that references none) → no section and no tab.
    if (message.addressTableLookups.length === 0) return null;

    return (
        <DataListCard id="address-lookups" title={ADDRESS_TABLE_LOOKUPS_CARD_TITLE}>
            <div className={HEADER_GRID}>
                <div>Address Lookup Table Address</div>
                <div>Table Index</div>
                <div>Resolved Address</div>
                <div>Details</div>
            </div>
            {lookupRows}
        </DataListCard>
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
        <span className="text-outer-space-300">
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
            resolvedKeyComponent = <span className="text-outer-space-300">Failed to fetch Lookup Table</span>;
        } else if (typeof lookupTable === 'string') {
            resolvedKeyComponent = <span className="text-outer-space-300">Invalid Lookup Table</span>;
        } else if (lookupTableIndex >= lookupTable.state.addresses.length) {
            resolvedKeyComponent = <span className="text-outer-space-300">Invalid Lookup Table Index</span>;
        } else {
            const resolvedKey = lookupTable.state.addresses[lookupTableIndex];
            resolvedKeyComponent = <Address pubkey={resolvedKey} link />;
        }
    }

    const writableBadge = !readOnly ? (
        <Badge ui="dashkit" variant="destructive">
            Writable
        </Badge>
    ) : undefined;

    return (
        <DataListRow>
            {/* Mobile: card leading with the resolved address, then the lookup table + index as fields. */}
            <div className="flex flex-col gap-1 p-3 text-sm lg:hidden">
                <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">{resolvedKeyComponent}</span>
                    {writableBadge && <span className="shrink-0">{writableBadge}</span>}
                </div>
                <div className="flex items-start gap-2">
                    <span className={MOBILE_LABEL}>Lookup Table</span>
                    <span className="min-w-0">
                        <Address pubkey={lookupTableKey} link />
                    </span>
                </div>
                <div className="flex items-start gap-2">
                    <span className={MOBILE_LABEL}>Table Index</span>
                    <span className="text-outer-space-300">{lookupTableIndex}</span>
                </div>
            </div>

            {/* Desktop layout (lg+): 4-column grid driven by the header. */}
            <div className={ROW_GRID_DESKTOP}>
                <div className="min-w-0 [grid-area:table]">
                    <Address pubkey={lookupTableKey} link />
                </div>
                <div className="text-outer-space-300 [grid-area:index]">{lookupTableIndex}</div>
                <div className="min-w-0 [grid-area:resolved]">{resolvedKeyComponent}</div>
                <div className="[grid-area:details]">{writableBadge}</div>
            </div>
        </DataListRow>
    );
}
