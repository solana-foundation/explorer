import { Idl } from '@coral-xyz/anchor';

/**
 * Serde formatter for the Anchor `Program` path. Modern Anchor IDLs (spec >= 0.1.0) are already in the
 * shape `new Program(...)` consumes; legacy pre-0.30 IDLs are converted to Codama root nodes upstream
 * (`normalizeAnchorIdl`) and decode through the Codama pipeline, so they never reach here. Kept as a
 * typed pass-through so the Program callers share one stable formatter entry point.
 */
export function formatSerdeIdl(idl: NonNullable<object>, _programAddress?: string): Idl {
    return idl as Idl;
}
