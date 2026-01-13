import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { resolveProgramId } from '../program-resolver';
import type { IdlSeedAccount, IdlSeedArg, IdlSeedConst } from '../types';

describe('resolveProgramId', () => {
    const defaultProgramId = PublicKey.default;
    const emptyContext = { args: {}, accounts: {} };

    it('should return default program ID when pdaProgram is undefined', () => {
        const result = resolveProgramId(defaultProgramId, undefined, emptyContext);
        expect(result).toEqual(defaultProgramId);
    });

    describe('const seed', () => {
        it('should resolve program ID from const seed value', () => {
            const constSeed: IdlSeedConst = {
                kind: 'const',
                value: Array.from(ASSOCIATED_TOKEN_PROGRAM_ID.toBytes()),
            };

            const result = resolveProgramId(defaultProgramId, constSeed, emptyContext);
            expect(result).toEqual(ASSOCIATED_TOKEN_PROGRAM_ID);
        });
    });

    describe('arg seed', () => {
        it('should resolve program ID from arg value in context', () => {
            const argSeed: IdlSeedArg = {
                kind: 'arg',
                path: 'program_id',
            };
            const context = {
                args: { programId: TOKEN_PROGRAM_ID.toBase58() },
                accounts: {},
            };

            const result = resolveProgramId(defaultProgramId, argSeed, context);
            expect(result).toEqual(TOKEN_PROGRAM_ID);
        });

        it('should return null when arg value is missing', () => {
            const argSeed: IdlSeedArg = {
                kind: 'arg',
                path: 'program_id',
            };

            const result = resolveProgramId(defaultProgramId, argSeed, emptyContext);
            expect(result).toBeNull();
        });

        it('should handle snake_case to camelCase conversion', () => {
            const argSeed: IdlSeedArg = {
                kind: 'arg',
                path: 'token_program',
            };
            const context = {
                args: { tokenProgram: TOKEN_PROGRAM_ID.toBase58() },
                accounts: {},
            };

            const result = resolveProgramId(defaultProgramId, argSeed, context);
            expect(result).toEqual(TOKEN_PROGRAM_ID);
        });
    });

    describe('account seed', () => {
        it('should resolve program ID from account value in context', () => {
            const accountSeed: IdlSeedAccount = {
                kind: 'account',
                path: 'token_program',
            };
            const context = {
                args: {},
                accounts: { tokenProgram: TOKEN_PROGRAM_ID.toBase58() },
            };

            const result = resolveProgramId(defaultProgramId, accountSeed, context);
            expect(result).toEqual(TOKEN_PROGRAM_ID);
        });

        it('should return null when account value is missing', () => {
            const accountSeed: IdlSeedAccount = {
                kind: 'account',
                path: 'token_program',
            };

            const result = resolveProgramId(defaultProgramId, accountSeed, emptyContext);
            expect(result).toBeNull();
        });

        it('should return null when account value is not a string', () => {
            const accountSeed: IdlSeedAccount = {
                kind: 'account',
                path: 'nested_account',
            };
            const context = {
                args: {},
                accounts: { nestedAccount: { inner: 'value' } },
            };

            const result = resolveProgramId(defaultProgramId, accountSeed, context);
            expect(result).toBeNull();
        });
    });
});
