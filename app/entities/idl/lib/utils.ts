export function getIdlDeclaredAddress(idl: unknown): string | undefined {
    const root = idl as {
        kind?: unknown;
        standard?: unknown;
        program?: { publicKey?: unknown };
        address?: unknown;
        metadata?: { address?: unknown };
    };
    const isCodamaRoot = root?.kind === 'rootNode' || root?.standard === 'codama';
    const addresses = isCodamaRoot ? [root.program?.publicKey] : [root?.address, root?.metadata?.address];
    return addresses.find(isNonEmptyString);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value !== '';
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
