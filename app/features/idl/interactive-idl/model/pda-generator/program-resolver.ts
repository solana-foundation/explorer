import { PublicKey } from '@solana/web3.js';
import { camelCase } from 'change-case';

import type { IdlSeed, IdlSeedAccount, IdlSeedArg, IdlSeedConst } from './types';

function isIdlSeedConst(seed: IdlSeed): seed is IdlSeedConst {
    return seed.kind === 'const';
}

function isIdlSeedArg(seed: IdlSeed): seed is IdlSeedArg {
    return seed.kind === 'arg';
}

function isIdlSeedAccount(seed: IdlSeed): seed is IdlSeedAccount {
    return seed.kind === 'account';
}

interface ResolverContext {
    args: Record<string, string | undefined>;
    accounts: Record<string, string | Record<string, string | undefined> | undefined>;
}

export function resolveProgramId(
    defaultProgramId: PublicKey,
    pdaProgram: IdlSeed | undefined,
    context: ResolverContext
): PublicKey | null {
    if (!pdaProgram) {
        return defaultProgramId;
    }

    if (isIdlSeedConst(pdaProgram)) {
        return new PublicKey(new Uint8Array(pdaProgram.value));
    }

    const path = camelCase(pdaProgram.path);

    if (isIdlSeedArg(pdaProgram)) {
        const value = context.args[path];
        return value ? new PublicKey(value) : null;
    }

    if (isIdlSeedAccount(pdaProgram)) {
        const value = context.accounts[path];
        return typeof value === 'string' ? new PublicKey(value) : null;
    }

    return defaultProgramId;
}
