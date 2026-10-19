export type IdlDeclaredAddress = { kind: 'none' } | { kind: 'malformed' } | { address: string; kind: 'address' };

export function getIdlDeclaredAddress(idl: unknown): IdlDeclaredAddress {
    const root = idl as {
        standard?: unknown;
        program?: { publicKey?: unknown };
        address?: unknown;
        metadata?: { address?: unknown };
    };
    const values = root?.standard === 'codama' ? [root.program?.publicKey] : [root?.address, root?.metadata?.address];
    const value = values.find(isDeclared);
    if (value === undefined) return { kind: 'none' };
    return typeof value === 'string' ? { address: value, kind: 'address' } : { kind: 'malformed' };
}

function isDeclared(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
}

/**
 * Attempt to parse string as JSON
 *
 * @param value
 * @returns
 */
export function safeJsonParse(value: string) {
    let v;
    try {
        v = JSON.parse(value);
    } catch (_e) {
        v = value;
    }
    return v;
}
