import { type Address, address, type ReadonlyUint8Array } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, TokenAccount } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS, Token2022Account } from '@solana-program/token-2022';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { identifyTokenAccountType, isTokenMintByOwner, isTokenProgramAddress } from '../token-program';

describe('token-program types', () => {
    it('should accept Address and return boolean from isTokenMintByOwner', () => {
        expectTypeOf(isTokenMintByOwner).parameter(0).toEqualTypeOf<Address>();
        expectTypeOf(isTokenMintByOwner).parameter(1).toEqualTypeOf<ReadonlyUint8Array | undefined>();
        expectTypeOf(isTokenMintByOwner).returns.toEqualTypeOf<boolean>();
    });

    it('should return TokenAccount | Token2022Account | undefined from identifyTokenAccountType', () => {
        expectTypeOf(identifyTokenAccountType).parameter(0).toEqualTypeOf<Address>();
        expectTypeOf(identifyTokenAccountType).parameter(1).toEqualTypeOf<ReadonlyUint8Array>();
        expectTypeOf(identifyTokenAccountType).returns.toEqualTypeOf<TokenAccount | Token2022Account | undefined>();
    });

    it('should have matching Mint values for TokenAccount and Token2022Account', () => {
        expect(TokenAccount.Mint).toBe(Token2022Account.Mint);
        expect(TokenAccount.Token).toBe(Token2022Account.Token);
        expect(TokenAccount.Multisig).toBe(Token2022Account.Multisig);
    });
});

describe('isTokenProgramAddress', () => {
    it('should return true for the Token program address', () => {
        expect(isTokenProgramAddress(TOKEN_PROGRAM_ADDRESS)).toBe(true);
    });

    it('should return true for the Token-2022 program address', () => {
        expect(isTokenProgramAddress(TOKEN_2022_PROGRAM_ADDRESS)).toBe(true);
    });

    it('should return true for a plain string matching the Token program', () => {
        expect(isTokenProgramAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true);
    });

    it('should return true for a plain string matching the Token-2022 program', () => {
        expect(isTokenProgramAddress('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')).toBe(true);
    });

    it('should return false for an unrelated program', () => {
        expect(isTokenProgramAddress('11111111111111111111111111111111')).toBe(false);
    });
});

describe('identifyTokenAccountType', () => {
    // identifyTokenAccount discriminates purely by data length: 82 = mint, 165 = token, 355 = multisig.
    it('should return undefined for malformed data', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(0))).toBeUndefined();
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array([1, 2, 3]))).toBeUndefined();
    });

    it('should identify an 82-byte Token account as a mint', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(82))).toBe(TokenAccount.Mint);
    });

    it('should identify a 165-byte Token account as a token account', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(165))).toBe(TokenAccount.Token);
    });

    it('should identify a 355-byte Token account as a multisig', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(355))).toBe(TokenAccount.Multisig);
    });

    it('should route Token-2022 owners through the Token-2022 identifier', () => {
        expect(identifyTokenAccountType(TOKEN_2022_PROGRAM_ADDRESS, new Uint8Array(82))).toBe(Token2022Account.Mint);
    });

    it('should return undefined for a non-token owner', () => {
        expect(
            identifyTokenAccountType(address('11111111111111111111111111111111'), new Uint8Array(82)),
        ).toBeUndefined();
    });
});

describe('isTokenMintByOwner', () => {
    it('should return true for a token owner with 82-byte mint data', () => {
        expect(isTokenMintByOwner(TOKEN_PROGRAM_ADDRESS, new Uint8Array(82))).toBe(true);
    });

    it('should return false for a token owner with 165-byte token-account data', () => {
        expect(isTokenMintByOwner(TOKEN_PROGRAM_ADDRESS, new Uint8Array(165))).toBe(false);
    });

    it('should return false for a non-token owner regardless of data', () => {
        expect(isTokenMintByOwner(address('11111111111111111111111111111111'), new Uint8Array(82))).toBe(false);
    });

    it('should return true for a token owner with no data (data-absent fast path)', () => {
        expect(isTokenMintByOwner(TOKEN_PROGRAM_ADDRESS)).toBe(true);
    });
});
