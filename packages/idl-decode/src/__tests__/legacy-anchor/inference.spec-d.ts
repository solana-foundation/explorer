// Compile-time guidance for the legacy Anchor (< 0.30) route — vitest typecheck only, nothing executes.
import type { Instruction } from '@solana/kit';
import { describe, expectTypeOf, it } from 'vitest';

import { createIdlClient, type IdlClient, tryCreateIdlClient, type TryCreateIdlErrorCode } from '../../client';
import { isLegacyAnchorIdl } from '../../detect';
import { type IdlError } from '../../errors';
import type { AnchorV00Idl, CodamaIdl } from '../../types';
import { type ExampleNativeTokenTransfers, loadNtt029Idl, loadNtt029IdlTyped, ntt029TransferIx } from '../fixtures';

describe('sample: legacy Anchor (< 0.30) IDL — converted at creation', () => {
    it('should type the legacy route as a codama client — the conversion is the implementation detail', () => {
        const client = createIdlClient(loadNtt029IdlTyped(), { programAddress: '11111111111111111111111111111111' });
        expectTypeOf(client).toEqualTypeOf<IdlClient<CodamaIdl>>();
    });

    it('should force the developer through error handling for untrusted input', () => {
        const [error, client] = tryCreateIdlClient(loadNtt029Idl());

        expectTypeOf(error).toEqualTypeOf<IdlError<TryCreateIdlErrorCode> | undefined>();
        expectTypeOf(client).toEqualTypeOf<IdlClient | undefined>();
    });

    it('should narrow the legacy document with the guard so a custom decoder receives a typed IDL', () => {
        const value: unknown = loadNtt029Idl();
        if (isLegacyAnchorIdl(value)) {
            expectTypeOf(value).toEqualTypeOf<AnchorV00Idl>();
            expectTypeOf(value.instructions[0].name).toEqualTypeOf<string>();
        }
    });
});

// A custom decoder generic over the literal legacy IDL — instruction names stay a literal union.
type LegacyName<T extends AnchorV00Idl> = T['instructions'][number]['name'];
declare function decodeLegacy<T extends AnchorV00Idl>(
    idl: T,
    ix: Instruction,
): { args: unknown; name: LegacyName<T> } | undefined;

describe('sample: legacy Anchor with a real generated companion type (NTT 0.29)', () => {
    it('should satisfy the AnchorV00Idl contract with the generated companion type', () => {
        expectTypeOf(loadNtt029IdlTyped()).toExtend<AnchorV00Idl>();
    });

    it('should give the custom decoder literal instruction-name guidance from the generated type', () => {
        const decoded = decodeLegacy(loadNtt029IdlTyped(), ntt029TransferIx);
        expectTypeOf(decoded).toEqualTypeOf<
            { args: unknown; name: ExampleNativeTokenTransfers['instructions'][number]['name'] } | undefined
        >();
    });
});
