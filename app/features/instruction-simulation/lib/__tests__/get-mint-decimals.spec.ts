import { getMintSize, getTokenSize } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import { toBase64 } from '@/app/shared/lib/bytes';

import {
    PARSED_USDC_TOKEN_ACCOUNT,
    PARSED_USDC_TOKEN_ACCOUNT_2022,
    PARSED_WSOL_MINT_ACCOUNT,
    POST_SYSTEM_ACCOUNT,
    postAccount,
    SOME_KEY,
    SYSTEM_PROGRAM_ADDRESS,
    TOKEN_2022_PROGRAM_ADDRESS,
    TOKEN_PROGRAM_ADDRESS,
    USDC_MINT,
    WSOL_MINT,
} from '../../mocks/token-accounts';
import { getMintDecimals } from '../get-mint-decimals';
import { ACCOUNT_TYPE_MINT, ACCOUNT_TYPE_TOKEN } from '../token-layout';

const MINT_SIZE = getMintSize();
const TOKEN_ACCOUNT_SIZE = getTokenSize();

/** mintAuthorityOption(4) + mintAuthority(32) + supply(8) = 44 */
const DECIMALS_OFFSET = 44;

describe('getMintDecimals', () => {
    it('should extract decimals from a pre-simulation parsed token account', () => {
        const result = getMintDecimals([SOME_KEY], [PARSED_USDC_TOKEN_ACCOUNT], [POST_SYSTEM_ACCOUNT]);

        expect(result[USDC_MINT.toBase58()]).toBe(6);
    });

    it('should extract decimals from a pre-simulation parsed mint account', () => {
        const result = getMintDecimals([WSOL_MINT], [PARSED_WSOL_MINT_ACCOUNT], [POST_SYSTEM_ACCOUNT]);

        expect(result[WSOL_MINT.toBase58()]).toBe(9);
    });

    it('should extract decimals from a post-simulation mint buffer', () => {
        const result = getMintDecimals([WSOL_MINT], [undefined], [postAccount(mintBase64(8), TOKEN_PROGRAM_ADDRESS)]);

        expect(result[WSOL_MINT.toBase58()]).toBe(8);
    });

    it('should collect decimals from multiple sources in one pass', () => {
        const result = getMintDecimals(
            [SOME_KEY, WSOL_MINT, USDC_MINT],
            [PARSED_USDC_TOKEN_ACCOUNT, PARSED_WSOL_MINT_ACCOUNT, undefined],
            [POST_SYSTEM_ACCOUNT, POST_SYSTEM_ACCOUNT, postAccount(mintBase64(6), TOKEN_PROGRAM_ADDRESS)],
        );

        expect(result[USDC_MINT.toBase58()]).toBe(6);
        expect(result[WSOL_MINT.toBase58()]).toBe(9);
    });

    it('should handle Token-2022 program owner for pre-simulation accounts', () => {
        const result = getMintDecimals([SOME_KEY], [PARSED_USDC_TOKEN_ACCOUNT_2022], [POST_SYSTEM_ACCOUNT]);

        expect(result[USDC_MINT.toBase58()]).toBe(6);
    });

    it('should handle Token-2022 program owner for post-simulation mint buffers', () => {
        const result = getMintDecimals(
            [USDC_MINT],
            [undefined],
            [postAccount(mintBase64(5), TOKEN_2022_PROGRAM_ADDRESS)],
        );

        expect(result[USDC_MINT.toBase58()]).toBe(5);
    });

    it('should skip post-simulation accounts owned by non-token programs', () => {
        const result = getMintDecimals([USDC_MINT], [undefined], [postAccount(mintBase64(6), SYSTEM_PROGRAM_ADDRESS)]);

        expect(result).toEqual({});
    });

    it('should skip post-simulation accounts with data shorter than 82 bytes', () => {
        const shortData = toBase64(new Uint8Array(50));
        const result = getMintDecimals([USDC_MINT], [undefined], [postAccount(shortData, TOKEN_PROGRAM_ADDRESS)]);

        expect(result).toEqual({});
    });

    it('should skip undefined pre-simulation accounts gracefully', () => {
        const result = getMintDecimals([SOME_KEY], [undefined], [POST_SYSTEM_ACCOUNT]);

        expect(result).toEqual({});
    });

    it('should return empty object when given empty arrays', () => {
        expect(getMintDecimals([], [], [])).toEqual({});
    });

    it('should handle post-simulation mint buffer larger than 82 bytes (Token-2022 extensions)', () => {
        const bytes = new Uint8Array(200);
        bytes[DECIMALS_OFFSET] = 7;
        bytes[DECIMALS_OFFSET + 1] = 1;
        bytes[TOKEN_ACCOUNT_SIZE] = ACCOUNT_TYPE_MINT;

        const result = getMintDecimals(
            [USDC_MINT],
            [undefined],
            [postAccount(toBase64(bytes), TOKEN_2022_PROGRAM_ADDRESS)],
        );

        expect(result[USDC_MINT.toBase58()]).toBe(7);
    });

    it('should skip post-simulation token accounts (165 bytes) mistakable for mints', () => {
        const bytes = new Uint8Array(TOKEN_ACCOUNT_SIZE);
        bytes[DECIMALS_OFFSET] = 1;
        bytes[DECIMALS_OFFSET + 1] = 1;

        const result = getMintDecimals([USDC_MINT], [undefined], [postAccount(toBase64(bytes), TOKEN_PROGRAM_ADDRESS)]);

        expect(result).toEqual({});
    });

    it('should skip post-simulation Token-2022 token accounts with extensions', () => {
        const bytes = new Uint8Array(250);
        bytes[DECIMALS_OFFSET] = 6;
        bytes[DECIMALS_OFFSET + 1] = 1;
        bytes[TOKEN_ACCOUNT_SIZE] = ACCOUNT_TYPE_TOKEN;

        const result = getMintDecimals(
            [USDC_MINT],
            [undefined],
            [postAccount(toBase64(bytes), TOKEN_2022_PROGRAM_ADDRESS)],
        );

        expect(result).toEqual({});
    });

    it('should prefer later sources when the same mint appears multiple times', () => {
        const result = getMintDecimals(
            [SOME_KEY, SOME_KEY],
            [PARSED_USDC_TOKEN_ACCOUNT, undefined],
            [POST_SYSTEM_ACCOUNT, postAccount(mintBase64(9), TOKEN_PROGRAM_ADDRESS)],
        );

        // Post-simulation mint overwrites pre-simulation token account
        expect(result[SOME_KEY.toBase58()]).toBe(9);
    });
});

/**
 * Build a base64-encoded mint buffer with the given decimals.
 * Layout: mintAuthorityOption(4) + mintAuthority(32) + supply(8) + decimals(1@44) + isInitialized(1@45)
 */
function mintBase64(decimals: number, size = MINT_SIZE): string {
    const bytes = new Uint8Array(size);
    bytes[DECIMALS_OFFSET] = decimals;
    bytes[DECIMALS_OFFSET + 1] = 1; // isInitialized
    return toBase64(bytes);
}
