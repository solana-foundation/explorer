import { isAddress } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

import { type SupportedIdl } from '../../lib/types';
import { getIdlDeclaredAddress } from '../../lib/utils';
import { tagIdl } from '../sourced-idl';
import { type CustomIdl } from './types';

export type CustomIdlParseError =
    | { kind: 'missing-address' }
    | { kind: 'invalid-address' }
    | { kind: 'invalid-declared-address' }
    | { kind: 'program-mismatch'; declaredAddress: string; programAddress: string }
    | { kind: 'cannot-load' }
    | { kind: 'check-failed' };

export type CustomIdlParseResult = { ok: true; customIdl: CustomIdl } | { ok: false; error: CustomIdlParseError };

export async function parseCustomIdl(json: unknown, programAddress: string | undefined): Promise<CustomIdlParseResult> {
    const declared = getIdlDeclaredAddress(json);
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
    const tagged = tagIdl(json as SupportedIdl);
    if (!canDecoderLoad(tagged, target)) return { error: { kind: 'cannot-load' }, ok: false };
    return { customIdl: { ...tagged, programAddress: target } as CustomIdl, ok: true };
}
