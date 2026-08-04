import type { Compression, DataSource, Encoding, Format } from '@solana-program/program-metadata';
/** The three decode hints `setData` and `initialize` carry on the wire. `format` classifies, it does not decode. */
export type PmpDecodeConfig = {
    encoding: Encoding;
    compression: Compression;
    format: Format;
};

/**
 * The content-carrying PMP instructions. The six housekeeping instructions (allocate, setAuthority,
 * setImmutable, trim, extend, close) never produce one of these - they fall through to the IDL card.
 */
export type PmpContentInstruction =
    | {
          kind: 'setData';
          config: PmpDecodeConfig;
          /** Absent on the 4-byte header-only shape, which carries no `dataSource` byte and no payload. */
          dataSource?: DataSource;
          /** Absent on the header-only shape and when the bytes live in `sourceBuffer`, which is read on demand. */
          payload?: Uint8Array;
          /** Account index 2 when it is not the program id, meaning the bytes come from a foreign buffer. */
          sourceBuffer?: string;
      }
    | {
          kind: 'initialize';
          config: PmpDecodeConfig;
          dataSource: DataSource;
          seed: string;
          /** Absent on the in-place path, where the bytes were pre-written to the metadata PDA and are read there. */
          payload?: Uint8Array;
          /** Account index 0, the metadata PDA that the in-place path pre-wrote. */
          metadataAccount?: string;
      }
    | {
          kind: 'write';
          offset: number;
          /** Absent when the chunk was copied from `sourceBuffer`, whose bytes are not in this transaction. */
          chunk?: Uint8Array;
          sourceBuffer?: string;
      };

/** The two instructions that carry decode hints, so the only two that can produce a decoded document. */
export type PmpPayloadInstruction = Extract<PmpContentInstruction, { kind: 'setData' | 'initialize' }>;

/**
 * Result of decoding an inline payload. Four non-document states, and none of them may throw out to the card or
 * render as a successful document:
 * - `oversized` is past the decode budget for its encoding. It carries the full decompressed bytes and no text,
 *   because nothing above the budget is decoded at all, so copy and download still work. `budget` is carried
 *   because it now varies by encoding, and the alert has to say which limit was hit.
 * - `unpack-overflow` was abandoned mid-unpack once its output passed the unpack ceiling, so unlike `oversized`
 *   there are no decompressed bytes to offer: they were never produced. Only the still-packed bytes exist.
 * - `failed` is a malformed stream or a payload that does not match its declared encoding.
 * - `empty` is zero payload bytes, which every encoding decodes to the empty string. An ordinary state, not a
 *   failure: an allocated-but-unwritten buffer reads this way. It carries nothing because there is nothing to
 *   carry, and it exists so `decoded` can never mean a blank document - see `decodePmpPayload`.
 *
 * `text` is display-ready: a `Json` payload arrives pretty-printed, everything else verbatim. The card renders it
 * as-is, so nothing downstream has to know which format produced it.
 */
export type PmpDecodedPayload =
    | { kind: 'decoded'; text: string; bytes: Uint8Array }
    | { kind: 'empty' }
    | { kind: 'oversized'; bytes: Uint8Array; budget: number }
    | { kind: 'unpack-overflow'; limit: number }
    | { kind: 'failed'; reason: string };

/** Which PMP account layout the body was read from. A Buffer carries no hints of its own, a Metadata does. */
export type PmpAccountKind = 'buffer' | 'metadata';

/**
 * The minimal account shape the pure account decoder needs, so `lib/` stays free of the accounts provider.
 * `owner` is base58 and `data` is the account's RAW bytes, header included.
 */
export type PmpAccountSnapshot = {
    owner: string;
    lamports: number;
    data: Uint8Array | undefined;
};

/**
 * Result of reading a payload from the account the instruction points at, rather than from the instruction.
 *
 * `absent` is an ordinary outcome, not an error: the canonical client closes a `setData` source buffer right
 * after the instruction to reclaim its rent, so a historical transaction's buffer is normally gone.
 */
export type PmpAccountContent =
    | { kind: 'absent' }
    | { kind: 'unreadable'; reason: string }
    | {
          kind: 'payload';
          account: PmpAccountKind;
          /** The hints the body was decoded with: a Metadata account's own, or the instruction's for a Buffer. */
          config: PmpDecodeConfig;
          /** The account body as stored, before decompression - what the Raw tab shows. */
          body: Uint8Array;
          payload: PmpDecodedPayload;
      };
