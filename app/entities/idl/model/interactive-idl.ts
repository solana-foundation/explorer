import { getIdlSpecType as getSerdeIdlSpecType } from './converters/convert-legacy-idl';
import { getIdlVersion, MODERN_ANCHOR_IDL_WILDCARD, type SupportedIdl } from './idl-version';

/**
 * Checks if the IDL version is supported for interactive features.
 * Supports modern Anchor IDL with specVersion '0.30.1' and spec >= '0.1.0'
 */
export function isInteractiveIdlSupported(idl: SupportedIdl): boolean {
    const specVersion = getIdlVersion(idl);

    // Only modern Anchor IDL (specVersion '0.30.1') is supported
    if (specVersion !== MODERN_ANCHOR_IDL_WILDCARD) return false;

    // Check if spec is >= 0.1.0
    const spec = getSerdeIdlSpecType(idl);
    const match = spec.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;

    const [, major, minor, patch] = match.map(Number);
    // >= 0.1.0
    if (major > 0) return true;
    if (major === 0 && minor > 1) return true;
    if (major === 0 && minor === 1 && patch >= 0) return true;

    return false;
}
