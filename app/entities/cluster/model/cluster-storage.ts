import { atomWithStorage } from 'jotai/utils';

import { DEFAULT_CUSTOM_URL } from '../lib/resolve-cluster';

// Persisted dev toggle: when on, the `customUrl` query param is honored on any cluster (see
// `isCustomUrlAllowed`). `getOnInit` reads localStorage synchronously so the value is correct on the
// very first render — the param-strip effect in ClusterProvider relies on that, since a one-render-late
// read would strip a valid `customUrl` before the flag loaded. Jotai's storage degrades gracefully when
// localStorage is unavailable (SSR / disabled), falling back to `false`.
//
// Storage-format note: this reads the flag as JSON. The pre-refactor toggle stored it as key-presence
// with an empty-string value ('') — not valid JSON — so jotai fails to parse it and falls back to
// `false`. A developer who had the flag on before this change must re-enable it once. Accepted for a
// dev-only toggle; not worth a migration.
export const customUrlEnabledAtom = atomWithStorage('enableCustomUrl', false, undefined, { getOnInit: true });

// The last custom RPC URL, persisted so `?cluster=custom` without a `customUrl` param reuses it across
// reloads. Also the write target of `useUpdateCustomUrl` (the cluster switcher).
export const rememberedCustomUrlAtom = atomWithStorage('explorer:customUrl', DEFAULT_CUSTOM_URL, undefined, {
    getOnInit: true,
});
