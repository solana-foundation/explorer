'use client';

import { Cluster } from '@utils/cluster';
import { getTokenInfoSwrKey } from '@utils/token-info';
import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { mutate } from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { getTokenInfos } from '../api/fetch-token-mints';

type RequestTokenInfo = (address: string, cluster: Cluster, genesisHash?: string) => void;
type BatchRequest = { address: string; cluster: Cluster; genesisHash?: string };

export const TokenInfoBatchContext = createContext<RequestTokenInfo | undefined>(undefined);

const BATCH_DELAY_MS = 100;
const MAX_WAIT_MS = 500;

function batchKey(cluster: Cluster, genesisHash?: string) {
    return `${cluster}:${genesisHash ?? ''}`;
}

function trackKey(cluster: Cluster, genesisHash: string | undefined, address: string) {
    return `${batchKey(cluster, genesisHash)}|${address}`;
}

export function TokenInfoBatchProvider({ children }: { children: React.ReactNode }) {
    const pending = useRef<Map<string, BatchRequest>>(new Map());
    const timer = useRef<NodeJS.Timeout | null>(null);
    const maxTimer = useRef<NodeJS.Timeout | null>(null);

    // Mints with a definitive answer already written to SWR (found or not-found) and mints whose POST is
    // outstanding, keyed by `cluster:genesisHash|address`. Used to skip redundant re-requests when a mint is
    // re-mounted or requested by a second consumer (e.g. the Token History filter dropdown reusing holdings mints).
    const resolved = useRef<Set<string>>(new Set());
    const inFlight = useRef<Set<string>>(new Set());

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
            const tracked = addresses.map(a => trackKey(cluster, genesisHash, a));
            tracked.forEach(t => inFlight.current.add(t));

            // getTokenInfos swallows fetch/HTTP errors and returns [] - indistinguishable from a genuine
            // all-not-found result. Its onError hook is the only failure signal, so use it to avoid caching a
            // transient error as permanent not-found: the provider is app-root-mounted and never remounts, and
            // useTokenInfo's SWR fetcher is null, so a wrongly-resolved mint would never retry this session.
            let failed = false;
            try {
                const tokens = await getTokenInfos(addresses, cluster, genesisHash, {
                    onError: e => {
                        failed = true;
                        Logger.error(new Error('[token-info] Batch fetch failed', { cause: e }));
                    },
                });
                // Leave unresolved on failure so a re-mount or a second consumer can retry.
                if (failed) continue;

                for (const token of tokens) {
                    mutate(getTokenInfoSwrKey(token.address, cluster, genesisHash), token, false);
                    addressSet.delete(token.address);
                }
                for (const missing of addressSet) {
                    mutate(getTokenInfoSwrKey(missing, cluster, genesisHash), undefined, false);
                }
                tracked.forEach(t => resolved.current.add(t));
            } catch (e) {
                Logger.error(new Error('[token-info] Batch fetch failed', { cause: e }));
                // Leave unresolved on failure so a later request can retry.
            } finally {
                tracked.forEach(t => inFlight.current.delete(t));
            }
        }
    }, [clearTimers]);

    const requestTokenInfo = useCallback<RequestTokenInfo>(
        (address, cluster, genesisHash) => {
            const tracked = trackKey(cluster, genesisHash, address);
            if (resolved.current.has(tracked) || inFlight.current.has(tracked)) return;

            // Keyed by the tracked key, not the bare address: the same mint requested for two networks inside the
            // batching window must stay two distinct entries, otherwise one network's request is silently dropped.
            pending.current.set(tracked, { address, cluster, genesisHash });

            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, BATCH_DELAY_MS);

            if (!maxTimer.current) {
                maxTimer.current = setTimeout(flush, MAX_WAIT_MS);
            }
        },
        [flush],
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
