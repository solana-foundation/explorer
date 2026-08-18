import { atomWithStorage } from 'jotai/utils';

// Persisted developer bypass. When on, a `customUrl` query param is honored with no per-endpoint consent
// (see `decideCustomUrl`). That is a standing permission for every link the developer opens, so turning
// it on asks for confirmation once (`ClusterModalDeveloperSettings`).
//
// `getOnInit` makes the flag correct on the first render allowed to read it — the one right after
// hydration, since `useClusterUrl` gates the decision on `useHydrated`. Without it the read lands a
// render later, and an opted-in developer sees the consent prompt for their own endpoint open and close
// again on every page load.
export const customUrlEnabledAtom = atomWithStorage('enableCustomUrl', false, undefined, { getOnInit: true });

// The custom RPC URL itself is deliberately not stored at all: the `customUrl` query param is its only
// source (see `useClusterUrl`), which is what keeps the endpoint shareable. A stored copy would let a
// link's endpoint outlive the page and be picked up by a later bare `?cluster=custom`. Consent for an
// endpoint is separate, tab-scoped state in `approved-origins.ts`.
