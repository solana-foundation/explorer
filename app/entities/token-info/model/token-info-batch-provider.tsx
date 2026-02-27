'use client';

import { Cluster } from '@utils/cluster';
import { getTokenInfoSwrKey } from '@utils/token-info';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { mutate } from 'swr';

import { getTokenInfos } from '../lib/fetch-token-mints';

type RequestTokenInfo = (address: string, cluster: Cluster, genesisHash?: string) => void;
type BatchRequest = { address: string; cluster: Cluster; genesisHash?: string };

export const TokenInfoBatchContext = createContext<RequestTokenInfo | undefined>(undefined);

const BATCH_DELAY_MS = 100;
const MAX_WAIT_MS = 500;

function batchKey(cluster: Cluster, genesisHash?: string) {
    return `${cluster}:${genesisHash ?? ''}`;
}

export function TokenInfoBatchProvider({ children }: { children: React.ReactNode }) {
    const pending = useRef<Map<string, BatchRequest>>(new Map());
    const timer = useRef<NodeJS.Timeout | null>(null);
    const maxTimer = useRef<NodeJS.Timeout | null>(null);

    const clearTimers = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        if (maxTimer.current) clearTimeout(maxTimer.current);
        timer.current = null;
        maxTimer.current = null;
    }, []);

    const flush = useCallback(async () => {
        clearTimers();

        if (pending.current.size === 0) return;

        const requests = Array.from(pending.current.values());
        pending.current.clear();

        const groups = new Map<string, BatchRequest[]>();
        for (const req of requests) {
            const key = batchKey(req.cluster, req.genesisHash);
            let group = groups.get(key);
            if (!group) {
                group = [];
                groups.set(key, group);
            }
            group.push(req);
        }

        for (const batch of groups.values()) {
            const { cluster, genesisHash } = batch[0];
            const addresses = batch.map(r => r.address);
            const addressSet = new Set(addresses);

            try {
                const tokens = await getTokenInfos(addresses, cluster, genesisHash);
                for (const token of tokens) {
                    mutate(getTokenInfoSwrKey(token.address, cluster, genesisHash), token, false);
                    addressSet.delete(token.address);
                }
                for (const missing of addressSet) {
                    mutate(getTokenInfoSwrKey(missing, cluster, genesisHash), undefined, false);
                }
            } catch (e) {
                console.error('Batch fetch failed:', e);
            }
        }
    }, [clearTimers]);

    const requestTokenInfo = useCallback<RequestTokenInfo>(
        (address, cluster, genesisHash) => {
            pending.current.set(address, { address, cluster, genesisHash });

            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, BATCH_DELAY_MS);

            if (!maxTimer.current) {
                maxTimer.current = setTimeout(flush, MAX_WAIT_MS);
            }
        },
        [flush]
    );

    useEffect(() => {
        return clearTimers;
    }, [clearTimers]);

    return <TokenInfoBatchContext.Provider value={requestTokenInfo}>{children}</TokenInfoBatchContext.Provider>;
}

export function useTokenInfoBatch() {
    const context = useContext(TokenInfoBatchContext);
    if (!context) {
        throw new Error('useTokenInfoBatch must be used within a TokenInfoBatchProvider');
    }
    return context;
}
