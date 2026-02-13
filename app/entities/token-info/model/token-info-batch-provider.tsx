'use client';

import { Cluster } from '@utils/cluster';
import { getTokenInfoSwrKey } from '@utils/token-info';
import React, { createContext, useCallback, useContext, useRef } from 'react';
import { mutate } from 'swr';

import { getTokenInfos } from '../lib/fetch-token-mints';

type RequestTokenInfo = (address: string, cluster: Cluster, genesisHash?: string) => void;
type BatchRequest = { address: string; cluster: Cluster; genesisHash?: string };

const TokenInfoBatchContext = createContext<RequestTokenInfo | undefined>(undefined);

const BATCH_DELAY_MS = 100;

export function TokenInfoBatchProvider({ children }: { children: React.ReactNode }) {
    const pending = useRef<Map<string, BatchRequest>>(new Map());
    const timer = useRef<NodeJS.Timeout | null>(null);

    const flush = useCallback(async () => {
        if (pending.current.size === 0) return;

        const requests = Array.from(pending.current.values());
        pending.current.clear();

        const { cluster, genesisHash } = requests[0];
        const addresses = requests.map(r => r.address);

        try {
            const tokens = await getTokenInfos(addresses, cluster, genesisHash);
            for (const token of tokens) {
                mutate(getTokenInfoSwrKey(token.address, cluster, genesisHash), token, false);
            }
        } catch (e) {
            console.error('Batch fetch failed:', e);
        }
    }, []);

    const requestTokenInfo = useCallback<RequestTokenInfo>(
        (address, cluster, genesisHash) => {
            pending.current.set(address, { address, cluster, genesisHash });

            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, BATCH_DELAY_MS);
        },
        [flush]
    );

    return <TokenInfoBatchContext.Provider value={requestTokenInfo}>{children}</TokenInfoBatchContext.Provider>;
}

export function useTokenInfoBatch() {
    const context = useContext(TokenInfoBatchContext);
    if (!context) {
        throw new Error('useTokenInfoBatch must be used within a TokenInfoBatchProvider');
    }
    return context;
}
