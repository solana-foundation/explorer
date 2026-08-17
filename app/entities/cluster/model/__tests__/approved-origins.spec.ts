import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpcEndpoint } from '../../lib/rpc-endpoint';
import { approvedOriginsAtom, approveRpcOriginAtom, parseApprovedOrigins } from '../approved-origins';

const STORAGE_KEY = 'explorer:approvedRpcOrigins';

beforeEach(() => {
    sessionStorage.clear();
});

describe('approveRpcOriginAtom', () => {
    it('should store the origin, never the full URL', () => {
        // Why it takes an `RpcEndpoint` rather than a string: storing a full URL as an "origin" throws
        // nothing, it just never matches `endpoint.origin`, so the user is re-asked on every page load.
        const store = createStore();

        store.set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/rpc?api-key=k'));

        expect(store.get(approvedOriginsAtom)).toEqual(['https://my-node.example']);
    });

    it('should treat a rotated key or a different path on the same server as already approved', () => {
        const store = createStore();

        store.set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/rpc?api-key=first'));
        store.set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/other?api-key=second'));

        expect(store.get(approvedOriginsAtom)).toEqual(['https://my-node.example']);
    });

    it('should keep a different port or scheme separate, since that is a different server', () => {
        const store = createStore();

        store.set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/rpc'));
        store.set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example:8899/rpc'));
        store.set(approveRpcOriginAtom, rpcEndpoint('http://my-node.example/rpc'));

        expect(store.get(approvedOriginsAtom)).toEqual([
            'https://my-node.example',
            'https://my-node.example:8899',
            'http://my-node.example',
        ]);
    });
});

// A reload is a fresh module evaluation: `atomWithStorage` reads storage once, when it is called. A new
// store alone does not re-read, so `createStore()` is not a reload and must not be used as one here.
async function reload() {
    vi.resetModules();
    return import('../approved-origins');
}

describe('approvedOriginsAtom persistence', () => {
    it('should survive a reload, since the endpoint is still in the address bar', async () => {
        createStore().set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/rpc'));

        const reloaded = await reload();

        expect(createStore().get(reloaded.approvedOriginsAtom)).toEqual(['https://my-node.example']);
    });

    it('should write to sessionStorage, so the approval dies with the tab', () => {
        createStore().set(approveRpcOriginAtom, rpcEndpoint('https://my-node.example/rpc'));

        expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(['https://my-node.example']);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should start empty in a tab that has approved nothing', async () => {
        const reloaded = await reload();

        expect(createStore().get(reloaded.approvedOriginsAtom)).toEqual([]);
    });
});

describe('parseApprovedOrigins', () => {
    it('should keep the origins it is given', () => {
        expect(parseApprovedOrigins(['https://a.example', 'http://b.example:8899'])).toEqual([
            'https://a.example',
            'http://b.example:8899',
        ]);
    });

    it('should return an empty list when the stored value is not an array', () => {
        // A non-array would throw on the `.includes` in `decideCustomUrl`.
        expect(parseApprovedOrigins({ 'https://a.example': true })).toEqual([]);
        expect(parseApprovedOrigins('https://a.example')).toEqual([]);
        expect(parseApprovedOrigins(null)).toEqual([]);
    });

    it('should drop entries that cannot be an origin', () => {
        expect(parseApprovedOrigins(['https://a.example', 42, '', null, { origin: 'x' }])).toEqual([
            'https://a.example',
        ]);
    });

    it('should recover from a hand-edited value rather than throw', async () => {
        sessionStorage.setItem(STORAGE_KEY, '{"not":"a list"}');

        const reloaded = await reload();

        expect(createStore().get(reloaded.approvedOriginsAtom)).toEqual([]);
    });

    it('should recover from a value that is not JSON at all', async () => {
        sessionStorage.setItem(STORAGE_KEY, 'not json');

        const reloaded = await reload();

        expect(createStore().get(reloaded.approvedOriginsAtom)).toEqual([]);
    });
});
