import { PMP_DECODED_RENDER_CAP_BYTES, type PmpAccountReadResult, readPmpAccount } from '@entities/pmp-account';
import { metadataAccountData } from '@entities/pmp-account/__fixtures__/pmp-account';
import { Compression, Encoding, Format, PROGRAM_METADATA_PROGRAM_ADDRESS } from '@solana-program/program-metadata';

/**
 * Fixtures shared by the PMP card specs and story files.
 *
 * Lives in `__fixtures__` rather than `__stories__` because both `__tests__` and `__stories__` consume it, and a spec
 * reaching into a stories folder for its builders reads as a dependency that is not really there.
 */
export {
    AUTHORITY,
    bufferAccountData,
    type BufferHeaderOverrides,
    DOC,
    DOC_PRETTY,
    metadataAccountData,
    pack,
} from '@entities/pmp-account/__fixtures__/pmp-account';

export const YAML_DOC = 'name: orbit\nversion: 1.0.0\n';

export const IDL_DOC = JSON.stringify({
    instructions: [{ name: 'initialize' }],
    name: 'company_program',
    version: '1.0.0',
});

/** One byte past the render cap, so unpacking it always lands on the `oversized` arm. */
export const OVERSIZED_DOC = 'x'.repeat(PMP_DECODED_RENDER_CAP_BYTES + 1);

/**
 * A Metadata account declaring `Base64` over a BINARY payload, which is what the devnet twin of the binary fixture
 * holds. `decodeData` renders those bytes as one unbroken base64 string - 512 stored bytes become 684 characters with
 * no space or newline anywhere in them, which is the shape that used to widen the whole card.
 */
export function metadataBase64AccountData(body: Uint8Array): Uint8Array {
    return metadataAccountData(body, {
        config: { compression: Compression.Gzip, encoding: Encoding.Base64, format: Format.None },
        seed: 'binary-blob',
    });
}

/**
 * Reads account bytes the way the card's stateful half does, then asserts which kind came out.
 *
 * The assertion is the point: it types the `header` prop without a cast at each call site, and a fixture whose bytes
 * stop producing the expected kind fails loudly here instead of quietly rendering the wrong card.
 */
export function readAs<TKind extends PmpAccountReadResult['kind']>(
    raw: Uint8Array,
    kind: TKind,
): Extract<PmpAccountReadResult, { kind: TKind }> {
    const result = readPmpAccount({
        account: { data: raw, lamports: 2_000_000, owner: PROGRAM_METADATA_PROGRAM_ADDRESS },
    });

    if (result.kind !== kind) {
        throw new Error(`fixture decoded as "${result.kind}", expected "${kind}"`);
    }

    return result as Extract<PmpAccountReadResult, { kind: TKind }>;
}
