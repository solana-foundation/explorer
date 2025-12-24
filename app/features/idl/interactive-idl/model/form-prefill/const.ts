import { NATIVE_MINT } from '@solana/spl-token';
import { PROGRAM_NAMES } from '@utils/programs';

import { generateNameVariations } from './providers/utils/generate-name-variations';

/**
 * Configuration for known program accounts that should be auto-filled.
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
const AUTHORITY = ['authority'];

export const WALLET_ACCOUNT_PATTERNS: readonly string[] = generateNameVariations(AUTHORITY, []);

export const KNOWN_PROGRAM_PATTERNS: Partial<Record<PROGRAM_NAMES, readonly string[]>> = {
    [PROGRAM_NAMES.SYSTEM]: generateNameVariations(SYSTEM, [SYSTEM[0]]),
    [PROGRAM_NAMES.ASSOCIATED_TOKEN]: [
        ...generateNameVariations(ASSOCIATED_TOKEN, [ASSOCIATED_TOKEN[0]]),
        ...generateNameVariations(ATA, [ATA[0]]),
    ],
    [PROGRAM_NAMES.TOKEN]: generateNameVariations(TOKEN, [TOKEN[0]]),
};

// Known addresses for non-program accounts (e.g., well-known mints)
export const KNOWN_ACCOUNT_PATTERNS: Record<string, readonly string[]> = {
    [NATIVE_MINT.toBase58()]: generateNameVariations(WSOL, [WSOL[1]]),
};

// Collect all known patterns for exclusion checks
const ALL_KNOWN_PATTERNS: readonly string[] = [
    ...Object.values(KNOWN_PROGRAM_PATTERNS).flat(),
    ...Object.values(KNOWN_ACCOUNT_PATTERNS).flat(),
];

/**
 * Checks if an account name matches any prefilled account pattern.
 * Used to prevent wallet prefill from overwriting accounts with known addresses.
 */
export function isPrefilledAccount(accountName: string): boolean {
    const normalizedName = accountName.toLowerCase().trim();
    return ALL_KNOWN_PATTERNS.some(pattern => normalizedName === pattern.toLowerCase());
}
