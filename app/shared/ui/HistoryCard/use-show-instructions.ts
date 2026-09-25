import 'client-only';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { createGuardedJsonStorage } from '@/app/shared/lib/guarded-json-storage';

export const SHOW_INSTRUCTIONS_STORAGE_KEY = 'explorer:history-show-instructions';

// Only the opt-out is persisted; `true` is the default and removes the key. No getOnInit: the atom
// starts at the default to match SSR and hydrates to the stored value on mount.
const storage = createGuardedJsonStorage<boolean>((value): value is boolean => typeof value === 'boolean', true);

export const showInstructionsAtom = atomWithStorage<boolean>(SHOW_INSTRUCTIONS_STORAGE_KEY, true, storage);

/** Whether history lists render the per-transaction instruction/program list under each signature. */
export function useShowInstructions() {
    return useAtom(showInstructionsAtom);
}
