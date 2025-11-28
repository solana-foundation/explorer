import type { PublicKey } from '@solana/web3.js';
import { atom } from 'jotai';

import type { BaseIdl, UnifiedProgram } from './unified-program';

// Program instance atom
const program = atom<UnifiedProgram | undefined>();

export const programAtom = atom(
    get => {
        const v = get(program);
        // if (v === undefined) throw new Error('programId is absent');
        return v;
    },
    (_get, set, next: UnifiedProgram | undefined) => {
        set(program, next);
    }
);

// Original IDL atom
const orignalIdl = atom<BaseIdl | undefined>();

export const originalIdlAtom = atom(
    get => {
        const v = get(orignalIdl);
        // if (v === undefined) throw new Error('orignalIdl is absent');
        return v;
    },
    (_get, set, next: BaseIdl) => {
        set(orignalIdl, next);
    }
);

export const unsetOriginalIdl = atom(null, (_, set) => {
    set(orignalIdl, undefined);
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
