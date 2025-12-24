import { NATIVE_MINT } from '@solana/spl-token';
import { PROGRAM_NAMES } from '@utils/programs';

import { generateNameVariations } from './providers/utils/generate-name-variations';

/**
 * Configuration for hardcoded program accounts that should be auto-filled.
 * Maps program names to arrays of account name patterns that should match this program.
 *
 * @example
 * To add a new program:
 * 1. Use an existing PROGRAM_NAMES enum value as a key, or add a new one
 * 2. Add an array of name patterns that should match this program
 * 3. Patterns are matched case-insensitively and support common naming conventions
 */
const SYSTEM = ['system', 'program'];
const ASSOCIATED_TOKEN = ['associated', 'token', 'program'];
const ATA = ['ata', 'program'];
const TOKEN = ['token', 'program'];
const WSOL = ['wsol', 'mint'];

export const HARDCODED_PROGRAM_PATTERNS: Partial<Record<PROGRAM_NAMES, readonly string[]>> = {
    [PROGRAM_NAMES.SYSTEM]: generateNameVariations(SYSTEM, [SYSTEM[0]]),
    [PROGRAM_NAMES.ASSOCIATED_TOKEN]: [
        ...generateNameVariations(ASSOCIATED_TOKEN, [ASSOCIATED_TOKEN[0]]),
        ...generateNameVariations(ATA, [ATA[0]]),
    ],
    [PROGRAM_NAMES.TOKEN]: generateNameVariations(TOKEN, [TOKEN[0]]),
};

// Hardcoded addresses for non-program accounts (e.g., well-known mints)
export const HARDCODED_ADDRESSES: Record<string, readonly string[]> = {
    [NATIVE_MINT.toBase58()]: generateNameVariations(WSOL, [WSOL[1]]),
};
