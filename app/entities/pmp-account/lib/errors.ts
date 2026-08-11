/**
 * Not every decoder throws an Error: pako threw bare strings before the unpack moved in-house, and the generated
 * decoders throw plain Errors, so a non-Error throw has to stay handled rather than read as `undefined`.
 */
export function toErrorReason(error: unknown, fallback: string): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return fallback;
}
