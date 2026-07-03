'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { Cluster, clusterUrl } from '../lib/cluster';
import { isCustomUrlAllowed } from '../lib/resolve-cluster';
import { customUrlEnabledAtom, rememberedCustomUrlAtom } from './cluster-storage';

type UseClusterUrlParams = {
    cluster: Cluster;
    searchParams: URLSearchParams | null;
    onReplaceSearchParams: (next: URLSearchParams) => void;
};

// Resolves the RPC endpoint for the active cluster. For non-custom clusters that's a fixed URL; for the
// Custom cluster it's the `customUrl` query param, gated by whether custom URLs are allowed right now
// (see `isCustomUrlAllowed`). Also owns the two side effects that keep the URL and the remembered value
// consistent: it persists a param-supplied URL for later reuse, and strips the param when custom URLs
// aren't allowed. Returns the raw `customUrl` too, since consumers embed it in shareable links.
export function useClusterUrl({ cluster, searchParams, onReplaceSearchParams }: UseClusterUrlParams): {
    customUrl: string;
    url: string;
} {
    const devFlagEnabled = useAtomValue(customUrlEnabledAtom);
    const [rememberedCustomUrl, setRememberedCustomUrl] = useAtom(rememberedCustomUrlAtom);
    const enableCustomUrl = isCustomUrlAllowed({ candidateUrl: rememberedCustomUrl, cluster, devFlagEnabled });

    // `|| undefined` converts an empty string param to undefined, so `??` falls back to the remembered URL
    const paramCustomUrl = enableCustomUrl ? searchParams?.get('customUrl') || undefined : undefined;
    const customUrl = paramCustomUrl ?? rememberedCustomUrl;

    // Remember a custom URL supplied via the query param so a later bare `?cluster=custom` reuses it.
    useEffect(() => {
        if (paramCustomUrl && paramCustomUrl !== rememberedCustomUrl) {
            setRememberedCustomUrl(paramCustomUrl);
        }
    }, [paramCustomUrl, rememberedCustomUrl, setRememberedCustomUrl]);

    // Strip the customUrl param when custom URLs aren't allowed — including when a later client-side
    // navigation re-introduces the param while the flag is already off (hence searchParams in the deps).
    // Stripping clears the param, so the guard is false on the re-run: no loop.
    useEffect(() => {
        if (!enableCustomUrl && searchParams?.has('customUrl')) {
            const nextSearchParams = new URLSearchParams(searchParams.toString());
            nextSearchParams.delete('customUrl');
            onReplaceSearchParams(nextSearchParams);
        }
    }, [enableCustomUrl, searchParams, onReplaceSearchParams]);

    return { customUrl, url: clusterUrl(cluster, customUrl) };
}
