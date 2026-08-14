/**
 * The `pmp-account` entity:
 * The on-chain Program Metadata Program ACCOUNT layouts and everything needed to read them.
 * This surface is HEAVY: it reaches the generated client, and with it pako, yaml and smol-toml.
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
export { decodePmpPayload, decodeUnpackedPayload, toDocumentText, unpackBounded } from './lib/decode-pmp-payload';
export type { BoundedUnpackResult } from './lib/decode-pmp-payload';
export { toErrorReason } from './lib/errors';
export { isPmpAccount } from './lib/program-address';
export { readPmpAccount } from './lib/read-pmp-account';
export type {
    BufferAccount,
    MetadataAccount,
    PmpAccountDecodeResult,
    PmpAccountReadResult,
    PmpAccountKind,
    PmpAccountSnapshot,
    PmpDecodeConfig,
    PmpPayloadDecodeResult,
} from './lib/types';
export { PmpDecodeConfigStruct } from './lib/validators';
