'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether React has finished hydrating, i.e. whether this render may read browser-only state.
 *
 * Browser-only state (localStorage, `window`, a media query) is invisible to the server, so reading it on
 * the render that hydrates the server's HTML produces different markup and React throws the subtree away.
 * Gate such state on this hook: the hydrating render matches the server, the browser's answer lands next.
 *
 * `useSyncExternalStore` rather than `useState(false)` + `useEffect`, because React reads
 * `getServerSnapshot` only on the server or while hydrating: a tree that never hydrated — a client-side
 * navigation, a test, a story — is hydrated from its first render and pays nothing. React also commits
 * the flip with the layout effects, so the pre-hydration value never reaches the screen.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(subscribe, isHydrated, isNotHydrated);
}

// A store that never notifies: the value changes once, when React swaps the server snapshot for the
// client one at the end of hydration, and React checks that itself on mount. Module level, because
// `useSyncExternalStore` re-subscribes whenever `subscribe` changes identity.
const subscribe = () => () => {};
const isHydrated = () => true;
const isNotHydrated = () => false;
