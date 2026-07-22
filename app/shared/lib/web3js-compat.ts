// Façade — the bridge moved to @explorer/parsers' transitional compat entry; app import paths stay stable.
export type { KitInstruction } from '@explorer/parsers';
export { toKitAddress, toKitInstruction, toLegacyPublicKey } from '@explorer/parsers/compat';
