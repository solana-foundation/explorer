import { getBase58Encoder, getBase64Encoder } from '@solana/kit';

// Lazy singletons: module-scope instantiation is a side effect that breaks tree-shaking (agadoo).
// Both encoders throw on invalid input (assertValidBaseString), so callers catch → warn + null.
let base58: ReturnType<typeof getBase58Encoder> | undefined;
let base64: ReturnType<typeof getBase64Encoder> | undefined;

export function base58Encoder(): ReturnType<typeof getBase58Encoder> {
    return (base58 ??= getBase58Encoder());
}

export function base64Encoder(): ReturnType<typeof getBase64Encoder> {
    return (base64 ??= getBase64Encoder());
}
