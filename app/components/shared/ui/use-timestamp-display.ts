import 'client-only';

import { getDefaultStore, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { createGuardedJsonStorage } from '@/app/shared/lib/guarded-json-storage';

// The representations a Timestamp can render. `unix` shows the raw seconds, `relative` shows "X ago".
// Single source of truth for both the type and the runtime guard so the two can't drift.
const DISPLAYS = ['utc', 'local', 'unix', 'relative'] as const;
export type TimestampDisplay = (typeof DISPLAYS)[number];

function isTimestampDisplay(value: unknown): value is TimestampDisplay {
    return DISPLAYS.includes(value as TimestampDisplay);
}

const STORAGE_KEY = 'explorer:timestamp-display';

// Persistence, cross-tab `storage`-event sync, and an SSR-safe default all come from atomWithStorage;
// the guarded storage validates so a corrupt or foreign value falls back to "not pinned" (undefined).
// No getOnInit: the atom starts undefined to match SSR and hydrates to the stored value on mount,
// avoiding a hydration mismatch.
const validatedStorage = createGuardedJsonStorage<TimestampDisplay | undefined>(
    (value): value is TimestampDisplay => isTimestampDisplay(value),
    undefined,
);

/** The global, persisted preference for which representation every Timestamp shows by default. */
export const pinnedTimestampDisplayAtom = atomWithStorage<TimestampDisplay | undefined>(
    STORAGE_KEY,
    undefined,
    validatedStorage,
);

/** The currently pinned representation, or `undefined` when the user hasn't pinned one. */
export function usePinnedTimestampDisplay(): TimestampDisplay | undefined {
    return useAtomValue(pinnedTimestampDisplayAtom);
}

/** Pin (or, with `undefined`, clear) the representation every Timestamp shows by default. */
export function setPinnedTimestampDisplay(value: TimestampDisplay | undefined): void {
    getDefaultStore().set(pinnedTimestampDisplayAtom, value);
}
