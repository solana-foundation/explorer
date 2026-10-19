import type { IdlSource } from '@entities/idl';
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
    },
);

// Original IDL atom
const originalIdl = atom<{ idl: BaseIdl; source: IdlSource } | undefined>();

export const originalIdlAtom = atom(
    get => get(originalIdl)?.idl,
    (_get, set, next: { idl: BaseIdl; source: IdlSource }) => {
        set(originalIdl, next);
    },
);

export const unsetOriginalIdl = atom(null, (_, set) => {
    set(originalIdl, undefined);
});

export const originalIdlSourceAtom = atom(get => get(originalIdl)?.source);

// Program ID atom
const programId = atom<PublicKey | undefined>();

export const programIdAtom = atom(
    get => get(programId),
    (_get, set, next: PublicKey) => {
        set(programId, next);
    },
);

export const unsetProgramId = atom(null, (_, set) => {
    set(programId, undefined);
});
