import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { camelCase } from 'change-case';

import type { PdaInstruction, PdaSeed } from './types';

/**
 * Build seed buffers from PDA seeds, form arguments, and accounts
 * Returns null if any required seed value is missing or invalid
 */
export function buildSeeds(
    seeds: PdaSeed[],
    args: Record<string, string | undefined>,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
    instruction: PdaInstruction
): Buffer[] | null {
    const seedBuffers: Buffer[] = [];

    for (const seed of seeds) {
        if (seed.kind === 'const') {
            if (!seed.value) {
                return null;
            }
            seedBuffers.push(Buffer.from(seed.value));
        } else if (seed.kind === 'arg') {
            if (!seed.path) {
                return null;
            }
            const camelPath = camelCase(seed.path);
            const argValue = args[camelPath];
            if (!argValue) {
                return null;
            }

            // Find arg definition - seed.path might not exactly match arg.name (e.g., "poll_id" vs "_poll_id")
            // Try exact match first, then try camelCase match
            const argDef =
                instruction.args.find(a => a.name === seed.path) ||
                instruction.args.find(a => camelCase(a.name) === camelPath);
            if (!argDef) {
                return null;
            }

            const seedBuffer = convertArgToSeedBuffer(argValue, argDef.type);
            if (!seedBuffer) {
                return null;
            }
            seedBuffers.push(seedBuffer);
        } else if (seed.kind === 'account') {
            if (!seed.path) {
                return null;
            }
            const camelPath = camelCase(seed.path);
            const accountValue = getAccountValue(accounts, camelPath);
            if (!accountValue) {
                return null;
            }
            try {
                const pubkey = new PublicKey(accountValue);
                seedBuffers.push(pubkey.toBuffer());
            } catch {
                return null;
            }
        }
    }

    return seedBuffers;
}

const INTEGER_SIZE_MAP: Record<string, number> = {
    i128: 16,
    i16: 2,
    i32: 4,
    i64: 8,
    i8: 1,
    u128: 16,
    u16: 2,
    u32: 4,
    u64: 8,
    u8: 1,
} as const;
/**
 * Convert argument value to seed buffer based on type
 */
function convertArgToSeedBuffer(value: string, type: unknown): Buffer | null {
    if (!value || typeof type !== 'string') {
        return null;
    }

    const size = INTEGER_SIZE_MAP[type];
    if (size !== undefined) {
        const bn = new BN(value);
        return bn.toArrayLike(Buffer, 'le', size);
    }

    if (type === 'string' || type === 'bytes') {
        return Buffer.from(value);
    }

    return null;
}

/**
 * Get account value from accounts record
 */
function getAccountValue(
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
    path: string
): string | null {
    const value = accounts[path];
    return typeof value === 'string' ? value : null;
}
