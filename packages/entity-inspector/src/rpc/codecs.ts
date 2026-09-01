import { getBase64Decoder, getBase64Encoder } from '@solana/kit';

// Lazy singletons: module-scope instantiation is a side effect that breaks tree-shaking (agadoo).
// The encoder throws on invalid input (assertValidBaseString), so callers catch → warn + null.
let base64: ReturnType<typeof getBase64Encoder> | undefined;
let base64Decode: ReturnType<typeof getBase64Decoder> | undefined;

export function base64Encoder(): ReturnType<typeof getBase64Encoder> {
    return (base64 ??= getBase64Encoder());
}

export function base64Decoder(): ReturnType<typeof getBase64Decoder> {
    return (base64Decode ??= getBase64Decoder());
}
