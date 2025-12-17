import type { LegacyIdlType } from '../convert-legacy-idl';

type HomogeneousTupleArray = { array: [LegacyIdlType, number] };

/**
 * Parses a homogeneous tuple (all elements same type) and returns it as an array type.
 * Supports tuples like ["u64", "u64"], ["string", "string"], etc.
 * Converts [T, T, ...] → { array: [T, N] }
 *
 * @param tuple - Array of legacy IDL types
 * @returns Array type structure, or null if not a valid homogeneous tuple
 */
export function parseHomogeneousTuple(tuple: unknown): HomogeneousTupleArray | null {
    if (!Array.isArray(tuple) || tuple.length === 0) {
        return null;
    }

    const first: LegacyIdlType = tuple[0];

    // We only support tuples where all elements are the same primitive string type
    if (typeof first !== 'string') {
        return null;
    }

    const isHomogeneous = tuple.every(t => t === first);
    if (!isHomogeneous) {
        return null;
    }

    return { array: [first, tuple.length] };
}

/**
 * Checks if the input is a valid homogeneous tuple.
 */
export function isHomogeneousTuple(tuple: unknown): boolean {
    return parseHomogeneousTuple(tuple) !== null;
}
