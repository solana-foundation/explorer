const SIMD_PREFIX = 'simd';

export function parseSimdQuery(query: string): number | undefined {
    const lower = query.trim().toLowerCase();
    if (!lower.startsWith(SIMD_PREFIX)) return parseSimdNumber(lower);

    const rest = lower.slice(SIMD_PREFIX.length).trimStart();
    return parseSimdNumber(rest.startsWith('-') ? rest.slice(1) : rest);
}

/** Registry entries are zero-padded and may carry upstream whitespace, so both sides parse to a number. */
export function parseSimdNumber(value: string): number | undefined {
    const digits = value.trim();
    // eslint-disable-next-line no-restricted-syntax -- Number() alone accepts 1e3, 0x10, 1.0
    if (!/^\d+$/.test(digits)) return undefined;
    return Number(digits);
}
