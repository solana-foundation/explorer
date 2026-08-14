import {
    PMP_DECODED_RENDER_CAP_BYTES,
    PMP_MAX_UNPACKED_BYTES,
    toDocumentText,
    unpackBounded,
} from '@entities/pmp-account';
import { Compression, Format } from '@solana-program/program-metadata';

export type ConfigResolutionFromBytesResult =
    | {
          kind: 'text';
          compression: Compression;
          /** The unpacked bytes, carried so a declared-config upgrade never inflates the body a second time. */
          payload: Uint8Array;
          text: string;
          /** `Format.Json` when `JSON.parse` accepted it. `undefined` is unresolved - Yaml/Toml/None are alike. */
          format: Format.Json | undefined;
      }
    /** Fails a strict UTF-8 decode, so there is no document to show. Renders through `RawDataField`. */
    | { kind: 'binary'; compression: Compression; payload: Uint8Array }
    | { kind: 'empty' }
    | { kind: 'incomplete' }
    | { kind: 'unpack-error'; reason: string }
    | { kind: 'oversized'; bytes: Uint8Array; budget: number }
    | { kind: 'overflow'; limit: number };

/** The two arms that carry bytes a decode config could describe. */
export type BufferConfigFromBytesPayload = Extract<ConfigResolutionFromBytesResult, { kind: 'binary' | 'text' }>;

/**
 * Resolves what a Buffer account's body can be rendered as, from the bytes alone.
 *
 * A Buffer header carries no encoding/compression/format - the fields do not exist on the Rust struct - so this is
 * the only thing that works for a buffer no `setData` has consumed yet, which is a normal pending state rather
 * than a broken account.
 *
 * Never throws. Every outcome is a member of the union above.
 */
export function resolveBufferConfigFromBytes(body: Uint8Array): ConfigResolutionFromBytesResult {
    if (body.length === 0) return { kind: 'empty' };

    const unpacked = unpackBounded(body, PMP_MAX_UNPACKED_BYTES);

    if (unpacked.kind === 'overflow') return { kind: 'overflow', limit: unpacked.limit };
    if (unpacked.kind === 'incomplete') return { kind: 'incomplete' };

    // A body that DECLARES a container and then fails to inflate is damaged, not uncompressed. pako reports both
    // through the same `error` arm - an UNCOMPRESSED body lands here too, with "incorrect header check" - so the
    // header is the only thing that separates them, and without this guard every plain text buffer would report a
    // failure instead of its document.
    //
    // Also gated on a failed UTF-8 decode: plain ASCII can match `isZlibStream` by chance.
    // A damaged stream is never readable text, so this rejects only those false matches.
    const utfBodyOrUndefined = toStrictUtf8(body);
    if (unpacked.kind === 'error' && isCompressed(body) && utfBodyOrUndefined === undefined) {
        return { kind: 'unpack-error', reason: unpacked.reason };
    }

    // A body that simply is not a compressed stream is `Compression.None`, not a failure.
    const inflated = unpacked.kind === 'ok' ? unpacked.bytes : undefined;

    // Cross-axis check. When the body BOTH inflates cleanly AND is itself valid UTF-8 that parses as JSON, the
    // text reading wins: for compressed bytes to be valid UTF-8 JSON is effectively impossible.
    //
    // Needs no gzip carve-out: a gzip stream can never be valid UTF-8.
    const bodyReadsAsJson = isJson(utfBodyOrUndefined);
    const isUncompressedStream = inflated === undefined || bodyReadsAsJson;

    const { compression, payload } = isUncompressedStream
        ? { compression: Compression.None, payload: body }
        : { compression: isGzipStream(body) ? Compression.Gzip : Compression.Zlib, payload: inflated };

    if (payload.length === 0) return { kind: 'empty' };
    if (payload.length > PMP_DECODED_RENDER_CAP_BYTES) {
        return { budget: PMP_DECODED_RENDER_CAP_BYTES, bytes: payload, kind: 'oversized' };
    }

    const text = toStrictUtf8(payload);
    if (text === undefined) return { compression, kind: 'binary', payload };

    const isJsonFormat = isJson(text);
    // Self-validating slack trim, for an UNCOMPRESSED payload only. A Buffer has no `data_length`, so an
    // over-allocated account carries trailing zeros inside its body. The trim is kept ONLY when it turned a
    // failing parse into a passing one, which is what makes it evidence rather than a guess.
    //
    // Never applied before the inflate: pako stops at the end of a stream on its own, so slack after a compressed
    // payload is already harmless.
    if (compression === Compression.None && !isJsonFormat) {
        const trimmed = trimTrailingZeros(payload);
        const trimmedText = trimmed.length === payload.length ? undefined : toStrictUtf8(trimmed);

        if (trimmedText !== undefined && isJson(trimmedText)) {
            return {
                compression,
                format: Format.Json,
                kind: 'text',
                payload: trimmed,
                text: toDocumentText(trimmedText, Format.Json),
            };
        }
    }

    const format = isJsonFormat ? Format.Json : undefined;
    return { compression, format, kind: 'text', payload, text: toDocumentText(text, format ?? Format.None) };
}

/**
 * Whether this resolution produced bytes a config could describe, as opposed to `empty`, `incomplete`,
 * `unpack-error`, `oversized` or `overflow` - the five outcomes with no payload for a config to apply to.
 *
 * A type guard so callers narrowing on it get `payload` and `compression` without re-testing the kind.
 */
export function hasPmpPayload(detection: ConfigResolutionFromBytesResult): detection is BufferConfigFromBytesPayload {
    return detection.kind === 'text' || detection.kind === 'binary';
}

/**
 * Whether config can't be retrieved from bytes and on-chain lookup is required.
 *
 * A `text` payload that parses as JSON stays certain even though its encoding is unproven: for the bytes to be text
 * that parses as JSON while some OTHER encoding was declared, an author would have had to write a base58, base64 or
 * hex document that happens to decode into valid JSON. Rendering it as the JSON document is right either way, so
 * the call would buy nothing.
 *
 * The non-payload arms are certain because there is no document to upgrade.
 */
export function isConfigFromBytesResolutionUncertain(detection: ConfigResolutionFromBytesResult): boolean {
    if (detection.kind === 'binary') return true;
    return detection.kind === 'text' && detection.format === undefined;
}

/**
 * Whether payload bytes have no readable text form, and so should be offered as bytes rather than as a document.
 */
export function isBinaryPayload(data: Uint8Array): boolean {
    return toStrictUtf8(data) === undefined;
}

/**
 * Whether a body declares either compression container this program uses.
 *
 * Says only that a stream STARTS here, never that it is intact - which is what makes it the right question to ask
 * once an inflate has already failed.
 */
export function isCompressed(body: Uint8Array): boolean {
    return isGzipStream(body) || isZlibStream(body);
}

/**
 * Whether a body opens with a valid zlib header, per RFC 1950 section 2.2.
 *
 * Two fields, both checked, because zlib has no fixed signature to compare against:
 * - `CM`, the low nibble of `CMF`, must be 8. Deflate is the only compression method the spec defines.
 * - the `CMF`/`FLG` pair read as a big-endian u16 must be a multiple of 31. `FCHECK`, the low 5 bits of `FLG`, is
 *   chosen at write time to make that hold, so it is a checksum over the two header bytes.
 *
 * A fixed pair like `78 01` would be wrong: `FLG` also encodes `FLEVEL`, so the same stream is written `78 01`,
 * `78 5e`, `78 9c` or `78 da` depending on compression level, and `78 9c` is the default. The rule above matches
 * all of them, and it is the same pair of constraints pako applies on inflate
 * (`(hold & 0x0f) !== Z_DEFLATED` and `% 31`, `pako@2.1.0/lib/zlib/inflate.js:472-479`).
 *
 * Unlike gzip's magic number this is only ten bits of evidence, so it has real false positives on text - `hb`,
 * `hC` and `h$` all pass. Callers must not treat a true here as proof on its own. Exported for its own tests.
 *
 * @see https://www.rfc-editor.org/rfc/rfc1950#section-2.2
 */
export function isZlibStream(body: Uint8Array): boolean {
    const cmf = body[0];
    const flg = body[1];

    // An out-of-range index is `undefined`, so a 0- or 1-byte body answers false instead of shifting NaN.
    if (cmf === undefined || flg === undefined) return false;

    return (cmf & 0x0f) === ZLIB_DEFLATE_METHOD && ((cmf << 8) | flg) % ZLIB_FCHECK_MODULUS === 0;
}

/** `CM` in RFC 1950 section 2.2. Deflate is the only method the spec defines. */
const ZLIB_DEFLATE_METHOD = 8;

/** `FCHECK` in RFC 1950 section 2.2 makes the two header bytes, read big-endian, a multiple of this. */
const ZLIB_FCHECK_MODULUS = 31;

/**
 * Whether a body opens with gzip's magic number, `1f 8b` - `ID1`/`ID2` in RFC 1952, fixed for every gzip stream
 * ever written. A header check, not a heuristic.
 *
 * Both ends of pako spell the same two bytes. It writes them as decimals on deflate,
 * `put_byte(s, 31); put_byte(s, 139)` (`pako@2.1.0/lib/zlib/deflate.js:1669`), and matches them on inflate as
 * `hold === 0x8b1f` (`inflate.js:451`) - byte-swapped only because `hold` is packed little-endian a byte at a time
 * in the loop above it, so the stream on the wire is still `1f 8b`.
 *
 * It earns its place by naming the compression: pako auto-detects gzip and zlib and inflates both, and the
 * decompressed bytes are identical either way, so a successful unpack says nothing about WHICH container it came
 * out of. Reading the still-packed body is the only thing that separates `Compression.Gzip` from `Compression.Zlib`.
 *
 * Worth knowing, though nothing branches on it: a gzip stream can never itself be valid UTF-8. `0x8b` is
 * `1000_1011`, and that leading `10` marks a CONTINUATION byte - yet it sits at offset 1, immediately after the
 * ASCII `0x1f`, where a new sequence has to open with a lead byte (`00-7F` or `C2-F4`), so a strict decoder rejects
 * `1f 8b` outright. That is why the JSON cross-axis check in `resolveBufferConfigFromBytes` needs no gzip guard:
 * the decode it depends on already fails for every gzip body.
 *
 * Safe on three counts:
 *
 * - **Short bodies.** An out-of-range index is `undefined`, which equals neither literal, so a 0- or 1-byte body
 *   reports false instead of throwing.
 * - **No collision with zlib.** A zlib header's low nibble must be 8 (deflate is the only defined method), and
 *   `0x1f & 0x0f` is 15, so a zlib stream can never begin `1f`. The two containers cannot be confused.
 * - **No false Gzip on an uncompressed body.** Naming the compression reads this only after a SUCCESSFUL inflate,
 *   so bytes that merely happen to start `1f 8b` without being a stream stay `Compression.None`.
 */
function isGzipStream(body: Uint8Array): boolean {
    return body[0] === 0x1f && body[1] === 0x8b;
}

/**
 * `getUtf8Decoder()` substitutes U+FFFD for invalid sequences instead of throwing, so it cannot be used as a
 * validity test. This runs its own `fatal` decode, which is the whole signal for the text-versus-binary split.
 */
function toStrictUtf8(data: Uint8Array): string | undefined {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(data);
    } catch {
        return undefined;
    }
}

function isJson(text: string | undefined): boolean {
    if (text === undefined) return false;
    try {
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}

/** Returns the input itself when there is nothing to trim, so the caller can compare by length. */
function trimTrailingZeros(data: Uint8Array): Uint8Array {
    let end = data.length;
    while (end > 0 && data[end - 1] === 0) end--;
    return end === data.length ? data : data.subarray(0, end);
}
