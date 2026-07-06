'use client';

import { atom, useAtom } from 'jotai';

// Open/close state for the cluster-switcher modal. A standalone atom, not tied to the cluster
// connection: there is a single app-wide switcher, and only the navbar button and the modal itself
// touch it. Setter-only consumers should read `clusterModalOpenAtom` via `useSetAtom` so they don't
// re-render on open/close.
export const clusterModalOpenAtom = atom(false);

export function useClusterModal() {
    return useAtom(clusterModalOpenAtom);
}
