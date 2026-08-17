'use client';

import { atom, useAtom } from 'jotai';

// Open/close state for the single app-wide cluster switcher. Setter-only consumers should take
// `clusterModalOpenAtom` via `useSetAtom`, so they don't re-render on open/close.
//
// This belongs in `features/cluster-switcher`, but two features open the modal — `cluster-switcher` and
// `idl`'s `ClusterSelector` — and FSD forbids feature→feature imports with no `@x` escape hatch, so the
// state moves down a layer instead. To move it back, give `ClusterSelector` an `onClusterChange` prop
// and let the page that composes it wire the switcher.
export const clusterModalOpenAtom = atom(false);

export function useClusterModal() {
    return useAtom(clusterModalOpenAtom);
}
