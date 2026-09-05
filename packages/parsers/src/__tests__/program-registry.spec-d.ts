import { describe, expectTypeOf, it } from 'vitest';

import type { RpcParsedAccountProgram, RpcParsedInstructionProgram, TokenProgram } from '../program-registry.js';

// Drift canaries: an accidental edit to either registry array breaks these pins. They live in a
// spec-d file so vitest reports them as tests — inside a runtime `it` they asserted nothing at run time.
describe('program registry types', () => {
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
        expectTypeOf<RpcParsedInstructionProgram>().toEqualTypeOf<
            | 'address-lookup-table'
            | 'bpf-loader'
            | 'bpf-upgradeable-loader'
            | 'spl-associated-token-account'
            | 'spl-memo'
            | 'spl-token'
            | 'spl-token-2022'
            | 'stake'
            | 'system'
            | 'vote'
        >();
    });
});
