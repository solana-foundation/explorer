import { is } from 'superstruct';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    isRpcParsedAccountProgram,
    isTokenProgram,
    RPC_PARSED_ACCOUNT_PROGRAMS,
    rpcParsedAccountProgram,
    TOKEN_PROGRAMS,
    tokenProgram,
    type RpcParsedAccountProgram,
    type TokenProgram,
} from '../program-registry.js';

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

    it('should validate members through the superstruct structs', () => {
        for (const program of TOKEN_PROGRAMS) {
            expect(is(program, tokenProgram)).toBe(true);
        }
        for (const program of RPC_PARSED_ACCOUNT_PROGRAMS) {
            expect(is(program, rpcParsedAccountProgram)).toBe(true);
        }
        expect(is('spl-memo', tokenProgram)).toBe(false);
        expect(is('spl-memo', rpcParsedAccountProgram)).toBe(false);
    });

    // Drift canaries: an accidental edit to either registry array breaks these pins.
    it('should pin the inferred unions to the RPC vocabulary', () => {
        expectTypeOf<TokenProgram>().toEqualTypeOf<'spl-token' | 'spl-token-2022'>();
        expectTypeOf<RpcParsedAccountProgram>().toEqualTypeOf<
            | 'address-lookup-table'
            | 'bpf-upgradeable-loader'
            | 'config'
            | 'nonce'
            | 'spl-token'
            | 'spl-token-2022'
            | 'stake'
            | 'sysvar'
            | 'vote'
        >();
    });
});
