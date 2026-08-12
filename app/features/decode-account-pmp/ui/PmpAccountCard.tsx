'use client';

import { type PmpAccountSnapshot, readPmpAccount } from '@entities/pmp-account';
import type { Account } from '@providers/accounts';
import React from 'react';

import { BufferAccountDataCard } from './BufferAccountDataCard';
import { MetadataAccountDataCard } from './MetadataAccountDataCard';
import { PmpAccountNoticeCard } from './PmpAccountNoticeCard';

/**
 * Reads the account and routes to the card.
 */
export function PmpAccountCard({ account }: { account: Account }) {
    const snapshot: PmpAccountSnapshot = React.useMemo(
        () => ({ data: account.data.raw, lamports: account.lamports, owner: account.owner.toBase58() }),
        [account.data.raw, account.lamports, account.owner],
    );

    const result = React.useMemo(() => readPmpAccount({ account: snapshot }), [snapshot]);

    switch (result.kind) {
        case 'metadata':
            return <MetadataAccountDataCard metadata={result} />;
        case 'buffer':
            return <BufferAccountDataCard address={account.pubkey.toBase58()} buffer={result} />;
        case 'absent':
        case 'empty':
        case 'unreadable':
            return <PmpAccountNoticeCard result={result} />;
    }
}
