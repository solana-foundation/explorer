import { act, renderHook } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CUSTOM_URL = 'http://localhost:8899';

// Hoisted so the module factories below can close over them.
const nav = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ replace: nav.replace }),
    useSearchParams: () => nav.searchParams,
}));

// Mutable, so a test can move the app to another endpoint the way a navigation would. Held as a string
// and parsed on read, the direction the real provider works in.
const clusterMock = vi.hoisted(() => ({ customUrl: 'http://localhost:8899' }));

// Spread the real barrel so `approvedOriginsAtom` and `parseRpcEndpoint` stay live. Only the cluster
// state is stubbed, since that is the input this hook reacts to.
vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({
            ...actual.clusterSelection(Cluster.Custom, clusterMock.customUrl),
            status: ClusterStatus.Connected,
        }),
    };
});

// Must import after mocks

import { approvedOriginsAtom } from '@entities/cluster';

import { useCustomUrlDraft } from '../use-custom-url-draft';

function setupDraft() {
    const store = createStore();
    const view = renderHook(() => useCustomUrlDraft(), {
        wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
    });

    return {
        /** The endpoint the app resolves changes, as a navigation from anywhere else would deliver it. */
        land(url: string) {
            clusterMock.customUrl = url;
            view.rerender();
        },
        /** Let the commit debounce fire. */
        settle() {
            act(() => vi.advanceTimersByTime(500));
        },
        store,
        /** One edit of the field. */
        type(next: string) {
            act(() => view.result.current.onChange(next));
        },
        value: () => view.result.current.value,
    };
}

describe('useCustomUrlDraft', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        clusterMock.customUrl = CUSTOM_URL;
        nav.searchParams = new URLSearchParams(`cluster=custom&customUrl=${CUSTOM_URL}&sort=fee`);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start on the endpoint the app resolved', () => {
        const draft = setupDraft();
        expect(draft.value()).toBe(CUSTOM_URL);
    });

    it('should show every keystroke as it is typed', () => {
        const draft = setupDraft();
        draft.type('http://my-n');
        expect(draft.value()).toBe('http://my-n');
    });

    // One navigation per typing pause, not one per keystroke.
    it('should not commit until typing pauses', () => {
        const draft = setupDraft();
        draft.type('http://my-node:8899');
        expect(nav.replace).not.toHaveBeenCalled();
    });

    it('should commit a typed endpoint to the query string', () => {
        const draft = setupDraft();
        draft.type('http://my-node:8899');
        draft.settle();

        // Unrelated params belong to the page underneath and survive the switch.
        expect(nav.replace).toHaveBeenCalledWith(
            `/?cluster=custom&customUrl=${encodeURIComponent('http://my-node:8899')}&sort=fee`,
        );
    });

    // Typing an endpoint is a first-party action, so it is its own consent. Otherwise the reader meets
    // the user's own endpoint as an unvetted inbound one and prompts for what they just typed.
    it('should approve the origin of a typed endpoint before navigating to it', () => {
        const draft = setupDraft();
        draft.type('https://my-node.example/rpc?api-key=secret');
        draft.settle();

        // Origin only — a rotated key on the same server must not ask again.
        expect(draft.store.get(approvedOriginsAtom)).toEqual(['https://my-node.example']);
    });

    // Navigating on these would churn the URL, and the reader would strip each attempt on arrival.
    it.each([['https:/'], ['not a url'], ['localhost:8899'], ['javascript:alert(1)']])(
        'should not commit the half-typed value %j',
        value => {
            const draft = setupDraft();
            draft.type(value);
            draft.settle();

            expect(nav.replace).not.toHaveBeenCalled();
            expect(draft.store.get(approvedOriginsAtom)).toEqual([]);
        },
    );

    it('should clear the endpoint when the field is emptied', () => {
        const draft = setupDraft();
        draft.type('');
        draft.settle();

        expect(nav.replace).toHaveBeenCalledWith('/?cluster=custom&sort=fee');
    });

    // A saved cluster, an in-app link or a declined prompt changes the endpoint without anyone touching
    // the field, which has to follow or it names an endpoint the app is not on.
    it('should follow an endpoint that arrives from outside', () => {
        const draft = setupDraft();
        draft.land('https://b.io');
        expect(draft.value()).toBe('https://b.io');
    });

    it('should not echo its own commit back over newer keystrokes', () => {
        const draft = setupDraft();

        // Commit one value...
        draft.type('https://a.io');
        draft.settle();
        // ...keep typing the rest of the URL while that navigation is in flight...
        draft.type('https://a.io/rpc');
        // ...and let it land.
        draft.land('https://a.io');

        expect(draft.value()).toBe('https://a.io/rpc');
    });

    // The echo guard covers one arrival and no more. Saving a cluster starts by typing its URL, so a
    // guard left standing would match that entry's click and leave the field showing the endpoint before.
    it('should follow a re-selected endpoint it committed earlier', () => {
        const draft = setupDraft();

        draft.type('https://a.io');
        draft.settle();
        draft.land('https://a.io');

        // Pick another endpoint, then come back to the one that was typed here.
        draft.land('https://b.io');
        expect(draft.value()).toBe('https://b.io');

        draft.land('https://a.io');
        expect(draft.value()).toBe('https://a.io');
    });
});
