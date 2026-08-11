import { ACCOUNT_HEADER_LENGTH, Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';

/**
 * Re-exported for the decode modules alongside, which already pull the library. The definition lives in its own
 * library-free module so the detection path can reach it without the client - see `program-address.ts`.
 */
export { PMP_ADDRESS } from './program-address';

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
 * Ceiling on the DECOMPRESSED output, enforced DURING the unpack rather than after it: `unpackBounded` stops the
 * stream as soon as the running total passes this, so peak allocation is this plus one 64 KB pako chunk. Applies
 * only to a COMPRESSED payload - `Compression.None` unpacks nothing, so there is nothing to bound on that path.
 *
 * Deliberately above every per-encoding budget, so a payload between its budget and this limit still reaches
 * `oversized`, which carries the decompressed bytes for copy and download. Only past this are there no bytes.
 */
export const PMP_MAX_UNPACKED_BYTES = 1024 * 1024;

/**
 * Both PMP account layouts put the payload body at byte 96, so anything shorter cannot carry one.
 *
 * Buffer:   disc [0,1) program [1,33) authority [33,65) canonical [65,66) seed [66,82) padding [82,96)
 * Metadata: disc [0,1) program [1,33) authority [33,65) mutable [65,66) canonical [66,67) seed [67,83)
 *           encoding [83,84) compression [84,85) format [85,86) dataSource [86,87) dataLength [87,91) padding [91,96)
 */
export const PMP_ACCOUNT_HEADER_LEN: number = ACCOUNT_HEADER_LENGTH;

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

/**
 * Badge labels for the bytes a payload panel holds, naming the compression rather than inventing a verb per variant,
 * so a Zlib payload reads as plainly as a Gzip one instead of as "zlibbed". `Compression.None` is excluded because
 * there is no distinction to label then: the stored bytes and the unpacked bytes are the same bytes.
 */
export const PMP_COMPRESSED_BYTES_LABELS: Record<Exclude<Compression, Compression.None>, string> = {
    [Compression.Gzip]: 'gzip',
    [Compression.Zlib]: 'zlib',
};

export const PMP_UNCOMPRESSED_BYTES_LABEL = 'uncompressed';

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
