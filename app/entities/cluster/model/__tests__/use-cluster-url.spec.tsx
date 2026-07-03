import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '../../lib/cluster';
import { customUrlEnabledAtom, rememberedCustomUrlAtom } from '../cluster-storage';
import { useClusterUrl } from '../use-cluster-url';

function renderUseClusterUrl({
    cluster,
    search = '',
    devFlagEnabled = false,
}: {
    cluster: Cluster;
    search?: string;
    devFlagEnabled?: boolean;
}) {
    const store = createStore();
    // Seed the flag before the hook mounts, mirroring a value already persisted at page load. Setting it
    // via the store also writes localStorage, so the atom's mount-time re-read stays consistent.
    if (devFlagEnabled) store.set(customUrlEnabledAtom, true);
    const onReplaceSearchParams = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store }, children);
    const searchParams = new URLSearchParams(search);
    const { result } = renderHook(() => useClusterUrl({ cluster, onReplaceSearchParams, searchParams }), { wrapper });
    return { onReplaceSearchParams, result, store };
}

beforeEach(() => localStorage.clear());

describe('useClusterUrl', () => {
    it('should honor the customUrl param on the Custom cluster and resolve it as the endpoint', () => {
        const { onReplaceSearchParams, result } = renderUseClusterUrl({
            cluster: Cluster.Custom,
            search: 'cluster=custom&customUrl=http://my-node:8899',
        });

        expect(result.current.customUrl).toBe('http://my-node:8899');
        expect(result.current.url).toBe('http://my-node:8899'); // Custom cluster: the endpoint is the customUrl
        expect(onReplaceSearchParams).not.toHaveBeenCalled();
    });

    it('should ignore and strip the customUrl param on a non-custom cluster without the dev flag', () => {
        const { onReplaceSearchParams, result } = renderUseClusterUrl({
            cluster: Cluster.Devnet,
            search: 'cluster=devnet&customUrl=http://evil.com',
        });

        expect(result.current.customUrl).toBe('http://localhost:8899'); // falls back to the default remembered URL
        expect(result.current.url).not.toContain('evil.com'); // devnet endpoint, not the ignored param
        expect(onReplaceSearchParams).toHaveBeenCalledTimes(1);
        const stripped = onReplaceSearchParams.mock.calls[0][0] as URLSearchParams;
        expect(stripped.has('customUrl')).toBe(false);
        expect(stripped.get('cluster')).toBe('devnet');
    });

    it('should honor the customUrl param on a non-custom cluster when the dev flag is enabled', () => {
        const { onReplaceSearchParams, result } = renderUseClusterUrl({
            cluster: Cluster.Devnet,
            devFlagEnabled: true,
            search: 'cluster=devnet&customUrl=http://my-node:8899',
        });

        expect(result.current.customUrl).toBe('http://my-node:8899');
        expect(onReplaceSearchParams).not.toHaveBeenCalled();
    });

    it('should remember a param-supplied custom URL for later reuse', () => {
        const { store } = renderUseClusterUrl({
            cluster: Cluster.Custom,
            search: 'cluster=custom&customUrl=http://remembered:1',
        });

        expect(store.get(rememberedCustomUrlAtom)).toBe('http://remembered:1');
    });
});
