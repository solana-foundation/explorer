import { is } from 'superstruct';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    isParsedAccountProgram,
    isParsedInstructionProgram,
    isRpcParsedAccountProgram,
    isRpcParsedInstructionProgram,
    isTokenProgram,
    RPC_PARSED_ACCOUNT_PROGRAMS,
    rpcParsedAccountProgram,
    RPC_PARSED_INSTRUCTION_PROGRAMS,
    rpcParsedInstructionProgram,
    TOKEN_PROGRAMS,
    tokenProgram,
} from '../program-registry.js';

type Vote = { program: 'vote'; parsed: { slot: number } };
type Stake = { program: 'stake'; parsed: { active: boolean } };
type ParsedData = Vote | Stake;
// Read through a typed accessor (not a literal `const`) so the inferred union
// stays wide — mirrors the app's `account.data.parsed` access.
const parsed = (): ParsedData => ({ parsed: { slot: 1 }, program: 'vote' });

// Mirrors web3.js ParsedInstruction — `program` is `string`, not a discriminated union.
type ParsedInstructionFixture = { program: string; parsed: { type: string } };
const instruction = (): ParsedInstructionFixture => ({ parsed: { type: 'transfer' }, program: 'spl-token' });

describe('program registry', () => {
    it('should accept every token program via the guard and reject outsiders', () => {
        for (const program of TOKEN_PROGRAMS) {
            expect(isTokenProgram(program)).toBe(true);
        }
        expect(isTokenProgram('spl-memo')).toBe(false);
        expect(isTokenProgram('')).toBe(false);
    });

    it('should accept every rpc parsed account program via the guard and reject outsiders', () => {
        for (const program of RPC_PARSED_ACCOUNT_PROGRAMS) {
            expect(isRpcParsedAccountProgram(program)).toBe(true);
        }
        expect(isRpcParsedAccountProgram('spl-memo')).toBe(false);
        expect(isRpcParsedAccountProgram('')).toBe(false);
    });

    it('should accept every rpc parsed instruction program via the guard and reject outsiders', () => {
        for (const program of RPC_PARSED_INSTRUCTION_PROGRAMS) {
            expect(isRpcParsedInstructionProgram(program)).toBe(true);
        }
        expect(isRpcParsedInstructionProgram('sysvar')).toBe(false);
        expect(isRpcParsedInstructionProgram('')).toBe(false);
    });

    it('should validate members through the superstruct structs', () => {
        for (const program of TOKEN_PROGRAMS) {
            expect(is(program, tokenProgram)).toBe(true);
        }
        for (const program of RPC_PARSED_ACCOUNT_PROGRAMS) {
            expect(is(program, rpcParsedAccountProgram)).toBe(true);
        }
        for (const program of RPC_PARSED_INSTRUCTION_PROGRAMS) {
            expect(is(program, rpcParsedInstructionProgram)).toBe(true);
        }
        expect(is('spl-memo', tokenProgram)).toBe(false);
        expect(is('spl-memo', rpcParsedAccountProgram)).toBe(false);
        expect(is('sysvar', rpcParsedInstructionProgram)).toBe(false);
    });

    describe('isParsedAccountProgram', () => {
        it('should return true when the discriminator matches', () => {
            expect(isParsedAccountProgram(parsed(), 'vote')).toBe(true);
        });

        it('should return false when the discriminator differs', () => {
            expect(isParsedAccountProgram(parsed(), 'stake')).toBe(false);
        });

        it('should return false for undefined or null data', () => {
            expect(isParsedAccountProgram(undefined, 'vote')).toBe(false);
            expect(isParsedAccountProgram(null, 'vote')).toBe(false);
        });

        it('should narrow the inferred union member on a match', () => {
            const data = parsed();
            if (isParsedAccountProgram(data, 'vote')) {
                expectTypeOf(data).toEqualTypeOf<Vote>();
                expectTypeOf(data.parsed).toEqualTypeOf<{ slot: number }>();
            }
        });
    });

    describe('isParsedInstructionProgram', () => {
        it('should return true when the instruction program matches', () => {
            expect(isParsedInstructionProgram(instruction(), 'spl-token')).toBe(true);
        });

        it('should return false when the instruction program differs', () => {
            expect(isParsedInstructionProgram(instruction(), 'spl-token-2022')).toBe(false);
        });

        it('should intersect the program literal without dropping the instruction shape', () => {
            const ix = instruction();
            if (isParsedInstructionProgram(ix, 'spl-token')) {
                expectTypeOf(ix.program).toEqualTypeOf<'spl-token'>();
                expectTypeOf(ix.parsed).toEqualTypeOf<{ type: string }>();
            }
        });
    });
});
