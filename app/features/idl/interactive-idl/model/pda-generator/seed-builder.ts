import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { camelCase } from 'change-case';

import type { PdaInstruction, PdaSeed } from './types';

export interface SeedInfo {
    buffers: Buffer[] | null;
    info: { value: string | null; name: string }[];
}

interface ProcessedSeed {
    buffer: Buffer | null;
    info: { value: string | null; name: string };
}

/**
 * Build seed buffers and info from PDA seeds, form arguments, and accounts
 * Always includes all seeds in info, even when values are missing (null)
 * Returns null buffers if any required seed value is missing or invalid
 */
export function buildSeedsWithInfo(
    seeds: PdaSeed[],
    args: Record<string, string | undefined>,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
    instruction: PdaInstruction
): SeedInfo {
    const processedSeeds = seeds.map(seed => processSeed(seed, args, accounts, instruction));

    const seedBuffers: Buffer[] = [];
    const seedInfo: { value: string | null; name: string }[] = [];
    let buffersValid = true;

    for (const processed of processedSeeds) {
        seedInfo.push(processed.info);

        if (processed.buffer) {
            seedBuffers.push(processed.buffer);
        } else {
            buffersValid = false;
        }
    }

    return {
        buffers: buffersValid ? seedBuffers : null,
        info: seedInfo,
    };
}

/**
 * Process a single seed and return its buffer and info
 */
function processSeed(
    seed: PdaSeed,
    args: Record<string, string | undefined>,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
    instruction: PdaInstruction
): ProcessedSeed {
    switch (seed.kind) {
        case 'const':
            return processConstSeed(seed);
        case 'arg':
            return processArgSeed(seed, args, instruction);
        case 'account':
            return processAccountSeed(seed, accounts);
        default:
            return {
                buffer: null,
                info: { name: 'unknown', value: null },
            };
    }
}

/**
 * Process a const seed
 */
function processConstSeed(seed: PdaSeed): ProcessedSeed {
    if (!seed.value) {
        return {
            buffer: null,
            info: { name: 'const', value: null },
        };
    }

    const buffer = Buffer.from(seed.value);
    const hexValue = buffer.toString('hex');

    return {
        buffer,
        info: { name: `0x${hexValue}`, value: `0x${hexValue}` },
    };
}

/**
 * Process an arg seed
 */
function processArgSeed(
    seed: PdaSeed,
    args: Record<string, string | undefined>,
    instruction: PdaInstruction
): ProcessedSeed {
    if (!seed.path) {
        return {
            buffer: null,
            info: { name: 'arg', value: null },
        };
    }

    const camelPath = camelCase(seed.path);
    const argValue = args[camelPath];

    if (!argValue) {
        return {
            buffer: null,
            info: { name: camelPath, value: null },
        };
    }

    const argDef = findArgDefinition(seed.path, camelPath, instruction);
    if (!argDef) {
        return {
            buffer: null,
            info: { name: camelPath, value: argValue },
        };
    }

    const buffer = convertArgToSeedBuffer(argValue, argDef.type);
    return {
        buffer,
        info: { name: camelPath, value: argValue },
    };
}

/**
 * Process an account seed
 */
function processAccountSeed(
    seed: PdaSeed,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>
): ProcessedSeed {
    if (!seed.path) {
        return {
            buffer: null,
            info: { name: 'account', value: null },
        };
    }

    const camelPath = camelCase(seed.path);
    const accountValue = getAccountValue(accounts, camelPath);

    if (!accountValue) {
        return {
            buffer: null,
            info: { name: camelPath, value: null },
        };
    }

    try {
        const pubkey = new PublicKey(accountValue);
        return {
            buffer: pubkey.toBuffer(),
            info: { name: camelPath, value: accountValue },
        };
    } catch {
        return {
            buffer: null,
            info: { name: camelPath, value: accountValue },
        };
    }
}

/**
 * Find argument definition by matching seed path with instruction args
 * Handles cases where seed.path might not exactly match arg.name (e.g., "poll_id" vs "_poll_id")
 */
function findArgDefinition(seedPath: string, camelPath: string, instruction: PdaInstruction) {
    return (
        instruction.args.find(a => a.name === seedPath) || instruction.args.find(a => camelCase(a.name) === camelPath)
    );
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
        try {
            const bn = new BN(value);
            return bn.toArrayLike(Buffer, 'le', size);
        } catch {
            // Value cannot be converted to a number
            return null;
        }
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
