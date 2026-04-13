import type { Address, ReadonlyUint8Array } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, TokenAccount } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS, Token2022Account } from '@solana-program/token-2022';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { identifyTokenAccountType, isTokenMintByOwner, isTokenProgram } from '../token-program';

describe('token-program types', () => {
    it('isTokenMintByOwner should accept Address and return boolean', () => {
        expectTypeOf(isTokenMintByOwner).parameter(0).toEqualTypeOf<Address>();
        expectTypeOf(isTokenMintByOwner).parameter(1).toEqualTypeOf<ReadonlyUint8Array | undefined>();
        expectTypeOf(isTokenMintByOwner).returns.toEqualTypeOf<boolean>();
    });

    it('identifyTokenAccountType should return TokenAccount | Token2022Account | undefined', () => {
        expectTypeOf(identifyTokenAccountType).parameter(0).toEqualTypeOf<Address>();
        expectTypeOf(identifyTokenAccountType).parameter(1).toEqualTypeOf<ReadonlyUint8Array>();
        expectTypeOf(identifyTokenAccountType).returns.toEqualTypeOf<TokenAccount | Token2022Account | undefined>();
    });

    it('TokenAccount and Token2022Account should have matching Mint values', () => {
        expect(TokenAccount.Mint).toBe(Token2022Account.Mint);
        expect(TokenAccount.Token).toBe(Token2022Account.Token);
        expect(TokenAccount.Multisig).toBe(Token2022Account.Multisig);
    });
});

describe('isTokenProgram', () => {
    it('should return true for the Token program address', () => {
        expect(isTokenProgram(TOKEN_PROGRAM_ADDRESS)).toBe(true);
    });

    it('should return true for the Token-2022 program address', () => {
        expect(isTokenProgram(TOKEN_2022_PROGRAM_ADDRESS)).toBe(true);
    });

    it('should return true for a plain string matching the Token program', () => {
        expect(isTokenProgram('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true);
    });

    it('should return true for a plain string matching the Token-2022 program', () => {
        expect(isTokenProgram('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')).toBe(true);
    });

    it('should return false for an unrelated program', () => {
        expect(isTokenProgram('11111111111111111111111111111111')).toBe(false);
    });
});

describe('identifyTokenAccountType', () => {
    it('should return undefined for malformed data', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(0))).toBeUndefined();
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array([1, 2, 3]))).toBeUndefined();
    });
});
