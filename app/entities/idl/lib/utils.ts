import { type Address, isAddress } from '@solana/kit';

export type IdlDeclaredAddress = { kind: 'none' } | { kind: 'malformed' } | { address: Address; kind: 'address' };

export function getIdlDeclaredAddress(idl: unknown): IdlDeclaredAddress {
    const root = idl as {
        program?: { publicKey?: unknown };
        address?: unknown;
        metadata?: { address?: unknown };
    };
    const values = isCodamaRoot(idl) ? [root.program?.publicKey] : [root?.address, root?.metadata?.address];
    const value = values.find(isDeclared);
    if (value === undefined) return { kind: 'none' };
    return typeof value === 'string' && isAddress(value) ? { address: value, kind: 'address' } : { kind: 'malformed' };
}

export function isCodamaRoot(idl: unknown): boolean {
    const root = idl as { kind?: unknown; standard?: unknown } | null | undefined;
    return root?.kind === 'rootNode' || root?.standard === 'codama';
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
