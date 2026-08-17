'use client';

import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import type { RpcEndpoint } from '../lib/rpc-endpoint';

const STORAGE_KEY = 'explorer:approvedRpcOrigins';

/**
 * What comes back is `unknown`: the key is editable by hand, and a non-array would throw the moment
 * `decideCustomUrl` calls `.includes` on it. Non-strings are dropped rather than kept, since a value that
 * is not an origin cannot match one — it would sit in the list re-asking on every load.
 *
 * Not a security boundary. Only same-origin script can write here, so anything in this list is something
 * the user could have approved by clicking. The check is for robustness.
 */
export function parseApprovedOrigins(value: unknown): readonly string[] {
    if (!Array.isArray(value)) return NONE;
    const origins = value.filter(entry => typeof entry === 'string' && entry !== '');
    // The shared constant, not a fresh `[]`. jotai reads storage twice on load — once to seed the atom,
    // once on mount — and a new array identity the second time re-runs every memo keyed on this value.
    // Approving nothing is the common case, so it is the one that must not churn.
    return origins.length === 0 ? NONE : Object.freeze(origins);
}

const NONE: readonly string[] = Object.freeze([]);

// `sessionStorage`, so consent lives exactly as long as the tab. It has to survive a reload — the endpoint
// is in the address bar, so refreshing a page on a custom cluster would otherwise re-ask every time — but
// it must not outlive the tab, or it becomes a standing permission nobody remembers granting. A new tab
// starts clean, so a link opened tomorrow asks for itself.
//
// `getOnInit` makes the value correct on the first render allowed to read it. `useClusterUrl` gates that
// render on `useHydrated`, because this now differs between the server (no storage) and the browser.
//
// Wrapped so no read reaches the atom unchecked. `subscribe` is left alone: a `sessionStorage` area belongs
// to one tab, so nothing outside this document can write it, and the cross-tab event never fires.
const jsonStorage = createJSONStorage<readonly string[]>(() => {
    try {
        return sessionStorage;
    } catch {
        // `sessionStorage` does not exist on the server, and throws on access in some privacy modes. A
        // store that keeps nothing holds the atom at "nothing approved", which is the safe direction: the
        // app asks rather than assumes. jotai's own default returns `undefined` here, which its public
        // signature does not accept, so this returns a stub instead of widening the type.
        // eslint-disable-next-line unicorn/no-null -- Storage.getItem returns `string | null` for a miss
        return { getItem: () => null, removeItem: () => undefined, setItem: () => undefined };
    }
});
const validatedStorage: typeof jsonStorage = {
    ...jsonStorage,
    getItem: (key, initialValue) => parseApprovedOrigins(jsonStorage.getItem(key, initialValue)),
};

// Which RPC origins the user has agreed to connect to, in this tab.
//
// Keyed by origin, because the origin is who receives the queries: a rotated API key or a different path
// is the same server, so it must not ask again.
export const approvedOriginsAtom = atomWithStorage<readonly string[]>(STORAGE_KEY, NONE, validatedStorage, {
    getOnInit: true,
});

// The only way to grant approval. Taking the endpoint and reading the origin off it stops a caller from
// approving a whole host across schemes and ports, or storing something that is not an origin — which
// would not error, it would just never match, re-asking on every page load.
//
// Write-only atom: jotai treats any non-function first argument as the initial read value, so `undefined`
// means this holds no readable state and exists only for its write function.
export const approveRpcOriginAtom = atom(undefined, (get, set, endpoint: RpcEndpoint) => {
    const approved = get(approvedOriginsAtom);
    if (approved.includes(endpoint.origin)) return;
    set(approvedOriginsAtom, [...approved, endpoint.origin]);
});
