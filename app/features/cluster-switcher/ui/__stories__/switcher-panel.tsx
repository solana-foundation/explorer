// Shared story scaffolding for the pieces of the switcher. Not a `*.stories.*` file, so Storybook does
// not collect it (see `.storybook/main.ts`).

import type { Decorator } from '@storybook-config/types';
import { createStore, Provider as JotaiProvider } from 'jotai';
import React, { useState } from 'react';

import { type SavedCluster, savedClustersAtom } from '../../lib/cluster-storage';

/**
 * Puts a piece of the switcher in the panel it normally renders inside. The pills are `w-full`, so without
 * it they render on the docs page's own background at whatever width it gives them.
 */
export const withSwitcherPanel: Decorator = Story => (
    <div className="w-[350px] max-w-full bg-dk-gray-800-dark p-6">
        <div className="flex flex-wrap">
            <Story />
        </div>
    </div>
);

/**
 * Gives the story its own jotai store, seeded with `saved`. Every story seeds, including the empty ones:
 * `savedClustersAtom` is backed by localStorage, which outlives a story, so an unseeded one shows whatever
 * the last wrote.
 *
 * Order matters alongside a cluster decorator. Storybook applies `decorators` from the first entry
 * outwards, and `MockClusterProvider` seeds the cluster-modal atom into whichever store is in scope where
 * it sits, so this has to be outside it — `[withClusterState({ modalOpen: true }), withSavedClusters(…)]`.
 * Reversed, the atom lands in a store the modal never reads and the panel renders hidden.
 */
export function withSavedClusters(saved: SavedCluster[]): Decorator {
    return function WithSavedClusters(Story) {
        // Built once. A store rebuilt per render would drop anything a play function typed into it.
        const [store] = useState(() => {
            const created = createStore();
            created.set(savedClustersAtom, saved);
            return created;
        });

        return (
            <JotaiProvider store={store}>
                <Story />
            </JotaiProvider>
        );
    };
}
