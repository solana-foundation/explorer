import { useAccountInfo, useFetchAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import { decodePmpBufferAccount } from '../lib/decode-pmp-buffer-account';
import type { PmpAccountContent, PmpDecodeConfig } from '../lib/types';

export type PmpAccountPayloadState =
    | { status: 'loading' }
    | { status: 'failed' }
    | { status: 'ready'; content: PmpAccountContent };

/**
 * Reads the payload a PMP account currently holds.
 *
 * `config` must be referentially stable (pass the memoised instruction's own `config`), because it keys the
 * decode memo and a fresh object per render would re-decompress the payload on every render.
 *
 * `cap` overrides the per-encoding decode budget and is forwarded verbatim, so this path and the inline one are
 * bounded by the same rule.
 */
export function usePmpAccountPayload({
    address,
    config,
    cap,
}: {
    address: string;
    config: PmpDecodeConfig;
    cap?: number;
}): PmpAccountPayloadState {
    const fetchAccountInfo = useFetchAccountInfo();
    const entry = useAccountInfo(address);

    // Cached is not the same as cached WITH BYTES: all three fetch modes share one slot per address, and the
    // inspector fills it in `skip` mode, which stores none. Re-requesting settles, because a `raw` fetch always
    // stores bytes.
    const needsBytes =
        entry === undefined || (entry.status === FetchStatus.Fetched && entry.data?.data.raw === undefined);

    React.useEffect(() => {
        if (!needsBytes) return;
        fetchAccountInfo(new PublicKey(address), 'raw');
    }, [address, fetchAccountInfo, needsBytes]);

    return React.useMemo(() => {
        // `needsBytes` covers both "nothing cached yet" and "cached without bytes"; the effect above is already
        // requesting them, so both read as loading rather than as a decode of an entry that has nothing to decode.
        if (needsBytes || entry === undefined || entry.status === FetchStatus.Fetching) return { status: 'loading' };
        if (entry.status === FetchStatus.FetchFailed || entry.data === undefined) return { status: 'failed' };

        const { data, lamports, owner } = entry.data;
        return {
            content: decodePmpBufferAccount({
                account: { data: data.raw, lamports, owner: owner.toBase58() },
                cap,
                config,
            }),
            status: 'ready',
        };
    }, [cap, config, entry, needsBytes]);
}
