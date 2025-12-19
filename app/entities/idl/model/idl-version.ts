import type { Idl } from '@coral-xyz/anchor';
import type { RootNode } from 'codama';

import { getIdlSpecType as getSerdeIdlSpecType } from './converters/convert-legacy-idl';

export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];
export type CodamaIdl = RootNode;
export type AnchorIdl = Idl;
export type SupportedIdl = CodamaIdl | AnchorIdl;

/**
 * Wildcard label used for all modern Anchor IDL versions (>= 0.30.1).
 * This is a label representing the modern Anchor IDL standard, not a specific version.
 */
export const MODERN_ANCHOR_IDL_WILDCARD = '0.30.1';

/**
 * Returns the IDL specification identifier.
 *
 * Note: '0.30.1' is used as a label for modern Anchor IDL specification (version >= 0.30.1).
 * It represents the modern Anchor IDL specification, not a specific version number.
 */
export function getIdlVersion(idl: SupportedIdl): IdlVersion {
    const spec = getSerdeIdlSpecType(idl);
    switch (spec) {
        case 'legacy':
            return 'Legacy';
        case 'codama':
            return (idl as RootNode).version;
        default:
            return MODERN_ANCHOR_IDL_WILDCARD;
    }
}

/**
 * Returns the IDL spec from metadata.spec for Anchor IDLs.
 * Returns null for legacy or codama IDLs.
 */
export function getIdlSpec(idl: SupportedIdl): string | null {
    const spec = getSerdeIdlSpecType(idl);
    if (spec === 'legacy' || spec === 'codama') return null;
    return spec;
}
