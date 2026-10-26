import { isAddress } from '@solana/kit';
import { array, is, literal, nonempty, number, optional, string, type, union } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { type AnchorIdl, type CodamaIdl, type TaggedIdl } from '../../lib/types';
import { getIdlDeclaredAddress, type IdlDeclaredAddress } from '../../lib/utils';
import { type CustomIdl } from './types';

export type CustomIdlParseError =
    | { kind: 'not-an-idl' }
    | { kind: 'missing-address' }
    | { kind: 'invalid-address' }
    | { kind: 'invalid-declared-address' }
    | { kind: 'program-mismatch'; declaredAddress: string; programAddress: string }
    | { kind: 'cannot-load' }
    | { kind: 'check-failed' };

export type CustomIdlParseResult = { ok: true; customIdl: CustomIdl } | { ok: false; error: CustomIdlParseError };

export async function parseCustomIdl(json: unknown, programAddress: string | undefined): Promise<CustomIdlParseResult> {
    const shape = matchIdlShape(json);
    if (!shape) return { error: { kind: 'not-an-idl' }, ok: false };

    const { tagged, declared } = shape;
    if (declared.kind === 'malformed') return { error: { kind: 'invalid-declared-address' }, ok: false };
    const declaredAddress = declared.kind === 'address' ? declared.address : undefined;
    const target = programAddress ?? declaredAddress;
    if (target === undefined) return { error: { kind: 'missing-address' }, ok: false };
    if (!isAddress(target)) return { error: { kind: 'invalid-address' }, ok: false };
    if (declaredAddress !== undefined && declaredAddress !== target) {
        return { error: { declaredAddress, kind: 'program-mismatch', programAddress: target }, ok: false };
    }

    let canDecoderLoad: typeof import('./can-decoder-load').canDecoderLoad;
    try {
        // The decoders are large, so they load only when there is an IDL to check.
        ({ canDecoderLoad } = await import('./can-decoder-load'));
    } catch (error) {
        Logger.error(new Error('[idl:custom-idl] Failed to load the decoder check', { cause: error }), {
            sentry: 'always',
        });
        return { error: { kind: 'check-failed' }, ok: false };
    }
    if (!canDecoderLoad(tagged, target)) return { error: { kind: 'cannot-load' }, ok: false };
    return { customIdl: { ...tagged, programAddress: target } as CustomIdl, ok: true };
}

const CodamaRoot = type({
    kind: literal('rootNode'),
    program: type({
        instructions: array(),
        kind: literal('programNode'),
        name: string(),
        publicKey: string(),
        version: optional(string()),
    }),
    standard: literal('codama'),
    version: string(),
});

const ModernAnchorIdl = type({
    address: nonempty(string()),
    instructions: array(type({ accounts: array(), args: array(), discriminator: array(number()), name: string() })),
    metadata: type({ name: string(), spec: string(), version: string() }),
});

const LegacyAnchorIdl = type({
    address: optional(string()),
    instructions: array(type({ accounts: array(), args: array(), name: string() })),
    metadata: optional(
        type({
            address: optional(string()),
            name: optional(string()),
            spec: optional(string()),
            version: optional(string()),
        }),
    ),
    name: string(),
    version: string(),
});

const CodamaMarker = union([type({ kind: literal('rootNode') }), type({ standard: literal('codama') })]);

type IdlShape = { tagged: TaggedIdl; declared: IdlDeclaredAddress };

function matchIdlShape(json: unknown): IdlShape | undefined {
    const declared = getIdlDeclaredAddress(json);
    if (is(json, CodamaRoot)) {
        return { declared, tagged: { idl: json as unknown as CodamaIdl, standard: 'Codama' } };
    }
    if (is(json, CodamaMarker)) return undefined;
    if (is(json, ModernAnchorIdl) || is(json, LegacyAnchorIdl)) {
        return { declared, tagged: { idl: json as unknown as AnchorIdl, standard: 'Anchor' } };
    }
    return undefined;
}
