/* eslint-disable @typescript-eslint/consistent-type-assertions -- the cast sits behind a runtime IDL guard TS cannot relate to the unresolved conditional return type */
import { identifyEventData, parseEventData } from '@codama/dynamic-parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import { convertToCodama } from '../anchor/convert.js';
import { getIdlStandard, isCodamaIdl } from '../detect/index.js';
import { isDecodeFailureMiss } from './discriminator-miss.js';
import { IDL_ERROR__EVENT_DECODE_FAILED, IdlError, ok } from '../errors.js';
import {
    type AnchorIdl,
    type CodamaIdl,
    codamaArm,
    type EventDecode,
    type SupportedIdl,
    unknownArm,
} from '../types.js';

// Anchor program events (emitted via `emit!`/`emit_cpi!`) carry an 8-byte discriminator + borsh payload.
// nodes-from-anchor (>= 1.5) converts them into the root's event nodes, so the same codama engine that
// decodes accounts and instructions decodes events too — no anchor Program / BorshEventCoder needed.
export function decodeEventWithIdl(idl: SupportedIdl, data: ReadonlyUint8Array): EventDecode {
    const errors: IdlError[] = [];
    const [convertError, root] = isCodamaIdl(idl) ? ok<CodamaIdl>(idl) : convertToCodama(idl as AnchorIdl);
    if (convertError) errors.push(convertError);
    if (root) {
        try {
            const parsed = parseEventData(root, data);
            if (parsed) return codamaArm(parsed);
            // A miss on a discriminator-bearing event is a decode failure, not a plain miss — surface it
            // so the diagnostic reaches Sentry rather than vanishing (see isDecodeFailureMiss).
            if (isDecodeFailureMiss(identifyEventData(root, data))) {
                errors.push(
                    new IdlError(IDL_ERROR__EVENT_DECODE_FAILED, {
                        dataLength: data.length,
                        standard: getIdlStandard(idl),
                    }),
                );
            }
        } catch (cause) {
            errors.push(
                new IdlError(IDL_ERROR__EVENT_DECODE_FAILED, {
                    cause,
                    dataLength: data.length,
                    standard: getIdlStandard(idl),
                }),
            );
        }
    }

    return unknownArm(errors);
}
