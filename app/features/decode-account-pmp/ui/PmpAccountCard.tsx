'use client';

import { type PmpAccountSnapshot, readPmpAccountHeader } from '@entities/pmp-account';
import type { Account } from '@providers/accounts';
import React from 'react';

import { useDecodePmpPayload } from '../model/use-decode-pmp-payload';
import { BasePmpAccountCard } from './BasePmpAccountCard';

/**
 * The Account Data tab's card for a PMP-owned account. Reads the 96-byte header on render, which costs nothing and
 * decides the rows, and leaves the payload decode to an effect so the rows and the loader paint first.
 */
export function PmpAccountCard({ account }: { account: Account }) {
    const snapshot: PmpAccountSnapshot = React.useMemo(
        () => ({ data: account.data.raw, lamports: account.lamports, owner: account.owner.toBase58() }),
        [account.data.raw, account.lamports, account.owner],
    );

    const header = React.useMemo(() => readPmpAccountHeader({ account: snapshot }), [snapshot]);

    // Only a Metadata account carries the hints its own bytes were written with, so it is the only kind there is
    // anything to decode for. A Buffer joins this once its config can be recovered from the write history of the
    // transactions that filled it.
    const decodedState = useDecodePmpPayload(header.kind === 'metadata' ? header.account : undefined);

    return <BasePmpAccountCard account={account} decodedState={decodedState} header={header} />;
}
