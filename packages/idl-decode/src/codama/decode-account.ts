/* eslint-disable @typescript-eslint/consistent-type-assertions -- the cast sits behind a runtime IDL guard TS cannot relate to the unresolved conditional return type */
import { parseAccountData } from '@codama/dynamic-parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import { convertToCodama } from '../anchor/convert.js';
import { getIdlStandard, isAnchorIdl, isCodamaIdl } from '../detect/index.js';
import { IDL_ERROR__ACCOUNT_DECODE_FAILED, IdlError, ok } from '../errors.js';
import {
    type AccountDecode,
    type AccountDecodeFor,
    anchorArm,
    type AnchorIdl,
    codamaArm,
    type CodamaIdl,
    type FallbackDecoderOptions,
    type SupportedIdl,
    unknownArm,
} from '../types.js';

// Same Codama pipeline as the instruction decode (account struct layouts travel with the nodes-from-anchor conversion); the anchor arm only comes from the injected fallback decoder until the Anchor-rich path lands.
export function decodeAccountWithIdl<T extends CodamaIdl>(
    idl: T,
    data: ReadonlyUint8Array,
    options?: FallbackDecoderOptions,
): AccountDecodeFor<T>;
export function decodeAccountWithIdl<T extends AnchorIdl>(
    idl: T,
    data: ReadonlyUint8Array,
    options?: FallbackDecoderOptions,
): AccountDecodeFor<T>;
export function decodeAccountWithIdl(
    idl: SupportedIdl,
    data: ReadonlyUint8Array,
    options?: FallbackDecoderOptions,
): AccountDecode;
export function decodeAccountWithIdl(
    idl: SupportedIdl,
    data: ReadonlyUint8Array,
    options: FallbackDecoderOptions = {},
): AccountDecode {
    const errors: IdlError[] = [];
    const [convertError, root] = isCodamaIdl(idl) ? ok<CodamaIdl>(idl) : convertToCodama(idl as AnchorIdl);
    if (convertError) errors.push(convertError);
    if (root) {
        try {
            const parsed = parseAccountData(root, data);
            // a miss (no discriminator match) is a plain miss, not an error
            if (parsed) return codamaArm(parsed);
        } catch (cause) {
            errors.push(
                new IdlError(IDL_ERROR__ACCOUNT_DECODE_FAILED, {
                    cause,
                    dataLength: data.length,
                    standard: getIdlStandard(idl),
                }),
            );
        }
    }

    // escape hatch for Anchor IDLs the conversion route cannot handle — injected, never bundled
    if (isAnchorIdl(idl) && options.fallbackDecoder?.decodeAccount) {
        try {
            const decoded = options.fallbackDecoder.decodeAccount(idl, data);
            // keep the bypassed pipeline errors observable — a rescue must not hide a broken conversion
            if (decoded !== undefined) return anchorArm(decoded, errors);
        } catch (cause) {
            // a throwing injected decoder must not escape the errors-as-values contract — fold it into the unknown arm
            errors.push(
                new IdlError(IDL_ERROR__ACCOUNT_DECODE_FAILED, {
                    cause,
                    dataLength: data.length,
                    standard: getIdlStandard(idl),
                }),
            );
        }
    }

    return unknownArm(errors);
}
