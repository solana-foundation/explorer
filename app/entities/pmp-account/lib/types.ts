import type {
    Buffer as BufferAccount,
    Compression,
    Encoding,
    Format,
    Metadata as MetadataAccount,
} from '@solana-program/program-metadata';

// Aliased on import: the generated account type is named `Buffer`, which would shadow the Node global.
export type { BufferAccount, MetadataAccount };

/** The three decode hints `setData` and `initialize` carry on the wire. `format` classifies, it does not decode. */
export type PmpDecodeConfig = {
    encoding: Encoding;
    compression: Compression;
    format: Format;
};

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
export type PmpPayloadDecodeResult =
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
 * Result of decoding account with its data payload.
 */
export type PmpAccountDecodeResult =
    | InvalidPmpAccountResult
    /** Allocated and not written yet, so there is no payload. */
    | { kind: 'empty' }
    | {
          kind: 'payload';
          account: PmpAccountKind;
          /** The hints the body was decoded with: a Metadata account's own, or the instruction's for a Buffer. */
          config: PmpDecodeConfig;
          /** The account body as stored, before decompression - what the Raw tab shows. */
          body: Uint8Array;
          payload: PmpPayloadDecodeResult;
      };

type InvalidPmpAccountResult = { kind: 'absent' } | { kind: 'unreadable'; reason: string };

export type PmpAccountValidateResult = InvalidPmpAccountResult | { kind: 'ok'; data: Uint8Array };

/**
 * The outcome of reading a PMP onchain Account.
 */
export type PmpAccountReadResult =
    | InvalidPmpAccountResult
    /** Allocated and not written yet. An ordinary state, so it is reported rather than treated as a failure. */
    | { kind: 'empty' }
    /** `program` and `authority` are zeroable options: `allocate` leaves both unset for a KEYPAIR buffer. */
    | { kind: 'buffer'; account: BufferAccount }
    /** Carries its own `encoding`/`compression`/`format`, so it structurally satisfies `PmpDecodeConfig`. */
    | { kind: 'metadata'; account: MetadataAccount };
