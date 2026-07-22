/* eslint-disable @typescript-eslint/consistent-type-assertions -- nodes-from-anchor ships its own (narrower) Anchor IDL + RootNode types */
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';

import { err, IDL_ERROR__IDL_PARSE_FAILED, IdlError, ok, type Result } from '../errors.js';
import type { AnchorV00Idl, AnchorV01Idl, CodamaIdl } from '../types.js';

/**
 * Convert an Anchor IDL — modern or legacy pre-0.30 — into the Codama model (nodes-from-anchor).
 * Error-first; a legacy IDL without `metadata.address` converts with an empty program address —
 * inject it from context.
 */
export function convertToCodama(
    idl: AnchorV00Idl | AnchorV01Idl,
): Result<CodamaIdl, typeof IDL_ERROR__IDL_PARSE_FAILED> {
    try {
        return ok(rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]));
    } catch (cause) {
        return err(new IdlError(IDL_ERROR__IDL_PARSE_FAILED, { cause, operation: 'rootNodeFromAnchor' }));
    }
}
