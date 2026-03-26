'use client';

import { useCluster } from '@providers/cluster';
import { Connection } from '@solana/web3.js';
import useSWR from 'swr';

import { fetchDecimals } from '../api/fetch-batch-decimals';
import type { ParsedSubInstruction } from '../lib/batch-parser';
import { collectLookups } from '../lib/collect-lookups';

export function useBatchDecimals(subInstructions: ParsedSubInstruction[]): Map<number, number> {
    const { url } = useCluster();
    const lookups = collectLookups(subInstructions);

    const swrKey =
        lookups.length > 0
            ? [
                  'batch-decimals',
                  lookups.map(l => (l.kind === 'mint' ? l.mintAddress : l.tokenAccountAddress)).join(','),
                  url,
              ]
            : undefined;

    const { data } = useSWR(swrKey, () => fetchDecimals(lookups, new Connection(url)), {
        revalidateOnFocus: false,
    });

    return data ?? new Map();
}
