// Shared Codama drivers for the __tests__ suites — codama's OWN tooling sits on the encode side, so
// the package under test only ever sees what real consumers produce. (The functional sweeps' drivers
// live in src/__tests__/fixtures.ts.)
import { getNodeCodec } from '@codama/dynamic-codecs';
import type { CodamaIdl, CodamaIdlInput } from '@explorer/idl-decode';

/* eslint-disable @typescript-eslint/consistent-type-assertions -- the inputs are known codama roots (detection is re-proven per test); the NodePath cast bridges codama tooling with the client */
export const DEFAULT_ADDRESS = '11111111111111111111111111111111';

// dynamic-codecs represents bytesTypeNode values as [encoding, data] tuples; the parsers READ them
// back as base64 regardless of what encoding fed the encoder.
export const base16 = (hex: string): [string, string] => ['base16', hex];
export const base64 = (data: string): [string, string] => ['base64', data];

/** Encode the named account's full field values (incl. discriminator defaults) with codama's OWN codec. */
export function encodeAccount(idl: CodamaIdlInput, name: string, data: object): Uint8Array {
    const root = idl as unknown as CodamaIdl;
    const node = root.program.accounts.find(item => item.name === name);
    if (!node) throw new Error(`${name} must be declared by the IDL`);
    const codec = getNodeCodec([root, root.program, node] as Parameters<typeof getNodeCodec>[0]);
    return Uint8Array.from(codec.encode(data));
}
