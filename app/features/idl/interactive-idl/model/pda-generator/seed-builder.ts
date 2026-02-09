import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { camelCase } from 'change-case';

import { parseArrayInput } from '../anchor/array-parser';
import type { IdlSeed, IdlSeedAccount, IdlSeedArg, IdlSeedConst, PdaArgument, PdaInstruction } from './types';

export interface SeedInfo {
    buffers: Buffer[] | null;
    info: { value: string | null; name: string }[];
}

/**
 * Build seed buffers and info from PDA seeds, form arguments, and accounts.
 * Always includes all seeds in info; buffers are null if any required value is missing or invalid.
 */
export function buildSeedsWithInfo(
    seeds: IdlSeed[],
    args: Record<string, string | undefined>,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>,
    instruction: PdaInstruction
): SeedInfo {
    const processed = seeds.map(seed => processSeed(seed, args, accounts, instruction));
    const info = processed.map(p => p.info);
    const buffers = processed.every(p => p.buffer !== null) ? (processed.map(p => p.buffer) as Buffer[]) : null;
    return { buffers, info };
}

interface ProcessedSeed {
    buffer: Buffer | null;
    info: { value: string | null; name: string };
}

function processSeed(
    seed: IdlSeed,
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
            return { buffer: null, info: { name: 'unknown', value: null } };
    }
}

function processConstSeed(seed: IdlSeedConst): ProcessedSeed {
    const buffer = Buffer.from(seed.value);
    const hex = buffer.toString('hex');
    return { buffer, info: { name: `0x${hex}`, value: `0x${hex}` } };
}

function processArgSeed(
    seed: IdlSeedArg,
    args: Record<string, string | undefined>,
    instruction: PdaInstruction
): ProcessedSeed {
    const camelPath = camelCase(seed.path);
    const value = args[camelPath];
    if (value === undefined) {
        return { buffer: null, info: { name: camelPath, value: null } };
    }
    const argDef =
        instruction.args.find(a => a.name === seed.path) ?? instruction.args.find(a => camelCase(a.name) === camelPath);
    if (argDef?.type === undefined) {
        return { buffer: null, info: { name: camelPath, value } };
    }
    const buffer = argToSeedBuffer(value, argDef.type);
    return { buffer, info: { name: camelPath, value } };
}

function processAccountSeed(
    seed: IdlSeedAccount,
    accounts: Record<string, string | Record<string, string | undefined> | undefined>
): ProcessedSeed {
    const camelPath = camelCase(seed.path);
    const raw = accounts[camelPath];
    const value = typeof raw === 'string' ? raw : null;
    if (!value) {
        return { buffer: null, info: { name: camelPath, value: null } };
    }
    try {
        return { buffer: new PublicKey(value).toBuffer(), info: { name: camelPath, value } };
    } catch {
        return { buffer: null, info: { name: camelPath, value } };
    }
}

const INTEGER_SEED_SIZES: Record<string, number> = {
    i128: 16,
    i16: 2,
    i256: 32,
    i32: 4,
    i64: 8,
    i8: 1,
    u128: 16,
    u16: 2,
    u256: 32,
    u32: 4,
    u64: 8,
    u8: 1,
};

function argToSeedBuffer(value: string, type: PdaArgument['type']): Buffer | null {
    if (!value.trim()) return null;

    const primitiveSize =
        typeof type === 'string' ? INTEGER_SEED_SIZES[type as keyof typeof INTEGER_SEED_SIZES] : undefined;
    if (primitiveSize !== undefined) return integerToSeedBuffer(value, primitiveSize);

    if (type === 'string' || type === 'bytes') return Buffer.from(value);
    if (type === 'pubkey') {
        try {
            return new PublicKey(value).toBuffer();
        } catch {
            return null;
        }
    }
    if (type === 'bool') {
        if (value === 'true') return Buffer.from([1]);
        if (value === 'false') return Buffer.from([0]);
        return null;
    }

    if (typeof type !== 'object' || type === null) return null;

    if ('option' in type || 'coption' in type) {
        const inner = 'option' in type ? type.option : type.coption;
        if (isOptionalValue(value)) return null;
        return argToSeedBuffer(value, inner);
    }
    if ('array' in type) {
        const [elementType, sizeDef] = type.array;
        const length = typeof sizeDef === 'number' ? sizeDef : null;
        if (length === null) return null;
        const trimmed = value.trim();
        const bytes =
            typeof elementType === 'string' && elementType === 'u8'
                ? parseU8ArrayFromHex(trimmed, length) ?? parseIntegerArray(value, 'u8', length)
                : typeof elementType === 'string'
                ? parseIntegerArray(value, elementType, length)
                : null;
        return bytes ? Buffer.from(bytes) : null;
    }

    return null;
}

function integerToSeedBuffer(value: string, size: number): Buffer | null {
    try {
        return new BN(value).toArrayLike(Buffer, 'le', size);
    } catch {
        return null;
    }
}

function parseU8ArrayFromHex(value: string, length: number): number[] | null {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    /* eslint-disable-next-line no-restricted-syntax -- validate hex string format */
    if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length !== length * 2) return null;
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
    return bytes;
}

function parseIntegerArray(value: string, elementType: string, length: number): number[] | null {
    let arr: string[];
    try {
        arr = parseArrayInput(value.trim()).map(String);
    } catch {
        return null;
    }
    if (arr.length !== length) return null;

    const size = INTEGER_SEED_SIZES[elementType];
    if (size === undefined) return null;

    const bytes: number[] = [];
    for (const item of arr) {
        try {
            const buf = new BN(item).toArrayLike(Buffer, 'le', size);
            for (let i = 0; i < buf.length; i++) bytes.push(buf[i]);
        } catch {
            return null;
        }
    }
    return bytes.length === length * size ? bytes : null;
}

function isOptionalValue(value: string): boolean {
    return value === '' || value === 'null' || value === 'undefined';
}
