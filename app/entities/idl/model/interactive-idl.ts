import type { Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { RootNode } from 'codama';

import { getIdlSpecType as getSerdeIdlSpecType } from './converters/convert-legacy-idl';
import { getIdlVersion, MODERN_ANCHOR_IDL_WILDCARD, type SupportedIdl } from './idl-version';

/**
 * Checks if the IDL version is supported for interactive features.
 * Supports modern Anchor IDL with specVersion '0.30.1' and spec >= '0.1.0',
 * and Codama IDLs.
 */
export function isInteractiveIdlSupported(idl: SupportedIdl): boolean {
    const spec = getSerdeIdlSpecType(idl);

    // Codama IDLs are supported
    if (spec === 'codama') return true;

    const specVersion = getIdlVersion(idl);

    // Only modern Anchor IDL (specVersion '0.30.1') is supported
    if (specVersion !== MODERN_ANCHOR_IDL_WILDCARD) return false;

    // Check if spec is >= 0.1.0
    // eslint-disable-next-line no-restricted-syntax -- parse semantic version string
    const match = spec.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;

    const [, major, minor, patch] = match.map(Number);
    // >= 0.1.0
    if (major > 0) return true;
    if (major === 0 && minor > 1) return true;
    if (major === 0 && minor === 1 && patch >= 0) return true;

    return false;
}

/**
 * Checks if the IDL's embedded program address mismatches the given program address.
 * Supports both Anchor IDLs (root-level `address`) and Codama IDLs (`program.publicKey`).
 */
export function isIdlProgramIdMismatch(idl: SupportedIdl, programAddress: string): boolean {
    const spec = getSerdeIdlSpecType(idl);
    const idlAddress = spec === 'codama' ? (idl as RootNode).program.publicKey : (idl as Idl).address;
    if (!idlAddress) return false;

    try {
        const idlKey = new PublicKey(idlAddress);
        const programKey = new PublicKey(programAddress);
        return !idlKey.equals(programKey);
    } catch {
        return true; // unparseable address → treat as mismatch
    }
}
