import type { Address, ReadonlyUint8Array } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS, TokenAccount } from '@solana-program/token';
import { Token2022Account } from '@solana-program/token-2022';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { identifyTokenAccountType, isTokenMintByOwner } from '../token-program';

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

describe('identifyTokenAccountType', () => {
    it('should return undefined for malformed data', () => {
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array(0))).toBeUndefined();
        expect(identifyTokenAccountType(TOKEN_PROGRAM_ADDRESS, new Uint8Array([1, 2, 3]))).toBeUndefined();
    });
});
