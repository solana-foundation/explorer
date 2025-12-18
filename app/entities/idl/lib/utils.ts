import { is, string } from 'superstruct';

function invariant(cond: any, message?: string): asserts cond is NonNullable<unknown> {
    if (cond === undefined) throw new Error(message ?? 'invariant violated');
}

const Address = string();

function isString(a: unknown): a is string {
    return is(a, Address);
}

/**
 * Extracts single address from IDL as it might be on the root level or inside the metadata
 *
 * @param idlData
 * @returns
 */
export function extractProgramAddressFromIdlData(idlData: NonNullable<any>, fallbackAddress?: string) {
    const { address, metadata } = idlData;

    const result = (metadata?.address ?? address) || fallbackAddress;
    invariant(result, 'IDL does not contain address');

    if (isString(result)) return result;

    if (!fallbackAddress) {
        invariant(fallbackAddress, 'IDL requires address');
    }

    // use fallback value as some IDLs do not include address
    return fallbackAddress;
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
