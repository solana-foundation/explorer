import type { Idl } from '@coral-xyz/anchor';
import type { RootNode } from 'codama';

import { type CodamaIdl, type IdlStandard, type IdlVersion, type SupportedIdl } from '../lib/types';
import { getIdlSpecType as getSerdeIdlSpecType } from './idl-spec';

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
 * Returns the IDL standard name: 'Codama' or 'Anchor'.
 */
export function getIdlStandard(idl: SupportedIdl): IdlStandard {
    return getSerdeIdlSpecType(idl) === 'codama' ? 'Codama' : 'Anchor';
}

/**
 * A legacy (pre-0.30) Anchor IDL the resolver converted to a Codama root for decoding — it carries the
 * original Anchor IDL as `legacyAnchorIdl`. The Codama root is an internal decode representation, so the
 * IDL's published standard is still Anchor (legacy).
 */
export function isConvertedLegacyAnchorIdl(idl: SupportedIdl): boolean {
    return 'legacyAnchorIdl' in idl && Boolean(idl.legacyAnchorIdl);
}

/**
 * A converted-legacy IDL whose original was produced by Shank (`metadata.origin === 'shank'`). Shank IDLs
 * omit unused types, so the detailed view may be incomplete — production shows a note for them, and this
 * restores that note after the Codama conversion (which erases the `origin` marker from the root).
 */
export function isConvertedLegacyShankIdl(idl: SupportedIdl): boolean {
    if (!isConvertedLegacyAnchorIdl(idl)) return false;
    const metadata = (idl as CodamaIdl).legacyAnchorIdl?.metadata as { origin?: string } | undefined;
    return metadata?.origin === 'shank';
}

/**
 * Single-line badge label describing the IDL's standard and version(s):
 *  - Codama:        `Codama (version 1.5.1)`         — root format version
 *  - Anchor modern: `Anchor 0.30.1 (version 0.1.0)`  — standard era (the modern-IDL marker) + spec
 *  - Anchor legacy: `Anchor (legacy)`                — no era number, no spec
 */
export function getIdlBadgeLabel(idl: SupportedIdl): string {
    // A converted-legacy Anchor IDL keeps its published "Anchor (legacy)" identity, matching production —
    // the Codama root it was converted into is only the decode representation, not a Codama IDL.
    if (isConvertedLegacyAnchorIdl(idl)) return 'Anchor (legacy)';

    const formatVersion = getIdlFormatVersion(idl);

    if (getIdlStandard(idl) === 'Codama') {
        return formatVersion ? `Codama (version ${formatVersion})` : 'Codama';
    }

    // Anchor: prefix the standard era (`0.30.1`, the modern-IDL marker); legacy IDLs have neither.
    const era = getIdlVersion(idl);
    if (era === 'Legacy') return 'Anchor (legacy)';
    return formatVersion ? `Anchor ${era} (version ${formatVersion})` : `Anchor ${era}`;
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

/**
 * Returns the IDL *format* (encoding) version — Codama's root `version` or Anchor's `metadata.spec` —
 * distinct from the program semver ({@link getIdlProgramVersion}). Legacy Anchor IDLs have no `spec`,
 * so they return `null`.
 */
export function getIdlFormatVersion(idl: SupportedIdl): string | null {
    if (getSerdeIdlSpecType(idl) === 'codama') {
        return (idl as RootNode).version;
    }
    // Modern Anchor declares `metadata.spec`; legacy Anchor has none.
    return getIdlSpec(idl);
}

/**
 * Returns the program's own version — the deployed program's semver, distinct from the IDL
 * spec/standard label that {@link getIdlVersion} returns. Reads `program.version` (Codama),
 * `metadata.version` (modern Anchor), or the top-level `version` (legacy Anchor); `null` when absent.
 */
export function getIdlProgramVersion(idl: SupportedIdl): string | null {
    if (getSerdeIdlSpecType(idl) === 'codama') {
        const program = (idl as RootNode).program as { version?: string };
        return program.version ?? null;
    }
    // Anchor: modern keeps the program version in `metadata.version`; legacy at the top level.
    const anchorIdl = idl as Idl & { version?: string };
    return anchorIdl.metadata?.version ?? anchorIdl.version ?? null;
}
