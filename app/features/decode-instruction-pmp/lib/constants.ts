import { ACCOUNT_HEADER_LENGTH, Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';

/**
 * Re-exported for the decode modules alongside, which already pull the library. The definition lives in its own
 * library-free module so the detection path can reach it without the client - see `program-address.ts`.
 */
export { PMP_ADDRESS } from './program-address';

/**
 * Program label for the card title and the Program row, matching what `CodamaInstructionCard` derives from the
 * IDL for the six housekeeping instructions: the rootNode program name `programMetadata` with its first letter
 * upper-cased. Deliberately NOT the registry name `PROGRAM_NAMES.PROGRAM_METADATA` ('Program Metadata Program'),
 * so a transaction carrying both a `setData` and an `allocate` labels both cards identically.
 */
export const PMP_CODAMA_PROGRAM_NAME = 'ProgramMetadata';

/**
 * Render cap for decoded content, shared by the three encodings whose decode cost is linear. Above it the card
 * renders a bounded raw view plus a download affordance instead of the full document. Measured on the
 * DECOMPRESSED payload bytes, so an oversized payload is never handed to `decodeData` or `JSON.parse` at all.
 */
export const PMP_DECODED_RENDER_CAP_BYTES = 256 * 1024;

/**
 * Decode budget per encoding, because the four encodings do not cost the same per byte.
 *
 * `decodeData(bytes, Encoding.Base58)` resolves to `getBase58Decoder()`, which folds the whole payload into one
 * BigInt and divides it down digit by digit, so it is QUADRATIC in the byte length. Measured against the installed
 * `@solana/codecs-strings`:
 *
 *      4 KB ->   26 ms       16 KB ->  427 ms       64 KB -> 7065 ms
 *      8 KB ->  101 ms       32 KB -> 1746 ms
 *
 * At the shared render cap that is minutes of blocked main thread, and the decode runs synchronously inside a
 * render memo, so nothing can paint while it runs. 16 KB is a deliberate pick: about 430 ms worst case, a visible
 * stall rather than a freeze. Do NOT raise it casually - the cost grows with the SQUARE of the budget, so doubling
 * it quadruples the stall.
 *
 * A `Record` keyed by the library enum rather than a lookup with a default, so a new variant breaks the build here
 * instead of silently inheriting a budget that was never measured for it.
 */
export const PMP_DECODE_BUDGET_BYTES: Record<Encoding, number> = {
    [Encoding.Base58]: 16 * 1024,
    [Encoding.Base64]: PMP_DECODED_RENDER_CAP_BYTES,
    [Encoding.None]: PMP_DECODED_RENDER_CAP_BYTES,
    [Encoding.Utf8]: PMP_DECODED_RENDER_CAP_BYTES,
};

/**
 * Ceiling on the DECOMPRESSED output, enforced DURING the unpack rather than after it: `inflateBounded` stops the
 * stream as soon as the running total passes this, so peak allocation is this plus one 64 KB pako chunk. Applies
 * only to a COMPRESSED payload - `Compression.None` unpacks nothing, so there is nothing to bound on that path.
 *
 * Deliberately above every per-encoding budget, so a payload between its budget and this limit still reaches
 * `oversized`, which carries the decompressed bytes for copy and download. Only past this are there no bytes.
 */
export const PMP_MAX_UNPACKED_BYTES = 1024 * 1024;

/** Download base names. `DownloadDropdown` appends `_<encoding>.txt`, so no extension belongs here. */
export const PMP_RAW_DOWNLOAD_FILENAME = 'pmp-payload-raw';
export const PMP_DECODED_DOWNLOAD_FILENAME = 'pmp-payload-decoded';
export const PMP_WRITE_CHUNK_DOWNLOAD_FILENAME = 'pmp-write-chunk';
export const PMP_ACCOUNT_RAW_DOWNLOAD_FILENAME = 'pmp-account-raw';

/**
 * Both PMP account layouts put the payload body at byte 96, so anything shorter cannot carry one.
 *
 * Buffer:   disc [0,1) program [1,33) authority [33,65) canonical [65,66) seed [66,82) padding [82,96)
 * Metadata: disc [0,1) program [1,33) authority [33,65) mutable [65,66) canonical [66,67) seed [67,83)
 *           encoding [83,84) compression [84,85) format [85,86) dataSource [86,87) dataLength [87,91) padding [91,96)
 */
export const PMP_ACCOUNT_HEADER_LEN: number = ACCOUNT_HEADER_LENGTH;

/** setData carries `dataSource` as an optional trailing byte, so 4 bytes is the header-only hint-update shape. */
export const HEADER_ONLY_SET_DATA_LEN = 4;

/** setData's optional `buffer` and write's optional `sourceBuffer` both sit at account index 2. */
export const PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX = 2;

// Explicit label maps rather than the numeric enums' reverse mapping: a new library variant then breaks the
// build here instead of rendering `undefined` in the card.
export const PMP_ENCODING_LABELS: Record<Encoding, string> = {
    [Encoding.Base58]: 'Base58',
    [Encoding.Base64]: 'Base64',
    [Encoding.None]: 'None (hex)',
    [Encoding.Utf8]: 'UTF-8',
};

export const PMP_COMPRESSION_LABELS: Record<Compression, string> = {
    [Compression.Gzip]: 'Gzip',
    [Compression.None]: 'None',
    [Compression.Zlib]: 'Zlib',
};

export const PMP_FORMAT_LABELS: Record<Format, string> = {
    [Format.Json]: 'JSON',
    [Format.None]: 'None',
    [Format.Toml]: 'TOML',
    [Format.Yaml]: 'YAML',
};

export const PMP_DATA_SOURCE_LABELS: Record<DataSource, string> = {
    [DataSource.Direct]: 'Direct',
    [DataSource.External]: 'External',
    [DataSource.Url]: 'Url',
};

/** Lowercase GA param values, so the event vocabulary stays stable if the display labels change. */
export const PMP_FORMAT_ANALYTICS_NAMES: Record<Format, string> = {
    [Format.Json]: 'json',
    [Format.None]: 'none',
    [Format.Toml]: 'toml',
    [Format.Yaml]: 'yaml',
};

export const PMP_DATA_SOURCE_ANALYTICS_NAMES: Record<DataSource, string> = {
    [DataSource.Direct]: 'direct',
    [DataSource.External]: 'external',
    [DataSource.Url]: 'url',
};

export const PMP_ANALYTICS_IX_NAMES = {
    initialize: 'initialize',
    setData: 'set_data',
} as const;

/**
 * Instruction account order, verified against the generated client's `getXInstruction` builders.
 * These are FINAL row labels, rendered verbatim. They carry Codama's own capitalisation (first letter upper,
 * no word split) so a `setData` card labels its accounts exactly like the `allocate` card next to it, which
 * `CodamaInstructionCard` builds with `charAt(0).toUpperCase() + slice(1)`.
 */
export const PMP_ACCOUNT_NAMES = {
    initialize: ['Metadata', 'Authority', 'Program', 'ProgramData', 'System'],
    setData: ['Metadata', 'Authority', 'Buffer', 'Program', 'ProgramData'],
    write: ['Buffer', 'Authority', 'SourceBuffer'],
} as const;

/** Instruction labels in Codama's style (the IDL name with its first letter upper-cased), for the same reason. */
export const PMP_IX_TITLES = {
    initialize: 'Initialize',
    setData: 'SetData',
    write: 'Write',
} as const;
