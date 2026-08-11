/**
 * The `pmp-account` entity: the on-chain Program Metadata Program ACCOUNT layouts (Buffer, Metadata, Empty) and
 * everything needed to read them. Its sibling `program-metadata` entity is a different concern - the IDL-label
 * resolution shim over `@entities/idl` - and neither imports the other.
 *
 * This surface is HEAVY: it reaches the generated client, and with it pako, yaml and smol-toml, none of which is
 * marked side-effect-free.
 */
export {
    isPmpMetadataAccountData,
    PMP_BUFFER_DISCRIMINATOR,
    PMP_EMPTY_DISCRIMINATOR,
    PMP_METADATA_DISCRIMINATOR,
} from './lib/account-discriminators';
export {
    PMP_ACCOUNT_HEADER_LEN,
    PMP_ADDRESS,
    PMP_COMPRESSED_BYTES_LABELS,
    PMP_COMPRESSION_LABELS,
    PMP_DATA_SOURCE_LABELS,
    PMP_DECODE_BUDGET_BYTES,
    PMP_DECODED_RENDER_CAP_BYTES,
    PMP_ENCODING_LABELS,
    PMP_FORMAT_LABELS,
    PMP_MAX_UNPACKED_BYTES,
    PMP_UNCOMPRESSED_BYTES_LABEL,
} from './lib/constants';
export { decodePmpAccount } from './lib/decode-pmp-account';
export { decodePmpPayload, toDocumentText, unpackBounded } from './lib/decode-pmp-payload';
export type { BoundedUnpackResult } from './lib/decode-pmp-payload';
export { toErrorReason } from './lib/errors';
export { isPmpAccount } from './lib/program-address';
export { readPmpAccountHeader } from './lib/read-pmp-account-header';
export type {
    // The generated `Buffer` / `Metadata` structs, aliased so `Buffer` cannot shadow the Node global.
    BufferAccount,
    MetadataAccount,
    PmpAccountContent,
    PmpAccountHeader,
    PmpAccountKind,
    PmpAccountSnapshot,
    PmpDecodeConfig,
    PmpDecodedPayload,
} from './lib/types';
export { PmpDecodeConfigStruct } from './lib/validators';
