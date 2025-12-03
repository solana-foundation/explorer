import type { PublicKey } from '@solana/web3.js';
import { atom } from 'jotai';

import type { BaseIdl, UnifiedProgram } from './unified-program';

// Program instance atom
const program = atom<UnifiedProgram | undefined>();

export const programAtom = atom(
    get => {
        const v = get(program);
        return v;
    },
    (_get, set, next: UnifiedProgram | undefined) => {
        set(program, next);
    }
);

// Original IDL atom
const originalIdl = atom<BaseIdl | undefined>();

export const originalIdlAtom = atom(
    get => {
        const v = get(originalIdl);
        return v;
    },
    (_get, set, next: BaseIdl) => {
        set(originalIdl, next);
    }
);

export const unsetOriginalIdl = atom(null, (_, set) => {
    set(originalIdl, undefined);
});

// Program ID atom
const programId = atom<PublicKey | undefined>();

export const programIdAtom = atom(
    get => get(programId),
    (_get, set, next: PublicKey) => {
        set(programId, next);
    }
);

export const unsetProgramId = atom(null, (_, set) => {
    set(programId, undefined);
});
