import { Compression, decodeData, Format } from '@solana-program/program-metadata';
import { Inflate } from 'pako';

import { bytes, concat } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { PMP_DECODE_BUDGET_BYTES, PMP_MAX_UNPACKED_BYTES } from './constants';
import type { PmpDecodeConfig, PmpDecodedPayload } from './types';

/**
 * Decodes an inline PMP payload: unpack, enforce the decode budget, then decode per `encoding` and present per
 * `format`. Never throws - every failure comes back as `{ kind: 'failed' }` so the card can degrade locally
 * without losing its accounts and config tables.
 *
 * Two bounds apply, because they guard different costs:
 * - `PMP_MAX_UNPACKED_BYTES` on the DECOMPRESSED output, enforced WHILE the stream inflates, because a small
 *   deflate stream can expand into hundreds of megabytes and pako offers no output limit of its own.
 * - the per-encoding budget on the unpacked bytes, checked BEFORE the encoding step so an oversized payload is
 *   never handed to `decodeData` or `JSON.parse`. That is the cost the budget exists to avoid, and it is where the
 *   render stays responsive: with `Encoding.Base58` the decode is quadratic. See `PMP_DECODE_BUDGET_BYTES`.
 *
 * `cap` overrides the per-encoding budget for the whole call. It exists so tests and stories can reach the guard
 * states without building a fixture hundreds of kilobytes wide.
 *
 * Zero payload bytes come back as `empty`, never as `decoded`. Every encoding decodes nothing to the empty string,
 * which would otherwise render as a blank document styled exactly like a successful one.
 */
export function decodePmpPayload({
    config,
    data,
    cap,
}: {
    config: PmpDecodeConfig;
    data: Uint8Array;
    cap?: number;
}): PmpDecodedPayload {
    const budget = cap ?? PMP_DECODE_BUDGET_BYTES[config.encoding];

    // Checked before the unpack: an empty stream emits no bytes and never ends, so a declared compression would
    // otherwise report an account that simply holds nothing as a truncated one.
    if (data.length === 0) {
        return { kind: 'empty' };
    }

    // `Compression.None` unpacks nothing, so the stored bytes ARE the payload. Modelled as an already-unpacked
    // result rather than a separate branch, so every outcome below is read off one union.
    const unpacked: BoundedUnpackResult =
        config.compression === Compression.None
            ? { bytes: data, kind: 'ok' }
            : unpackBounded(data, PMP_MAX_UNPACKED_BYTES);

    if (unpacked.kind === 'overflow') {
        return { kind: 'unpack-overflow', limit: unpacked.limit };
    }

    if (unpacked.kind === 'incomplete' || unpacked.kind === 'error') {
        // A buffer read while its `write` chunks are still landing holds a truncated stream, so `incomplete` is an
        // ordinary thing for this card to meet rather than corruption. Both leave the reader with no document, so
        // both present as `failed` and differ only in the reason.
        const reason = unpacked.kind === 'incomplete' ? 'the compressed stream is incomplete' : unpacked.reason;
        Logger.error(new Error('[pmp:decode-payload] failed to unpack'), { compression: config.compression, reason });
        return { kind: 'failed', reason };
    }

    const { bytes } = unpacked;

    if (bytes.length > budget) {
        return { budget, bytes, kind: 'oversized' };
    }

    if (bytes.length === 0) {
        return { kind: 'empty' };
    }

    try {
        const text = decodeData(bytes, config.encoding);
        if (typeof text !== 'string') {
            // No validated config can reach this: both entry points narrow `encoding` to the library enum first.
            // If it fires, `Encoding` grew a variant whose decoder returns something other than a string, and
            // every card holding that encoding renders a decode failure. Reported, because it is our drift.
            Logger.warn('[pmp:decode-payload] decodeData returned a non-string for a declared encoding', {
                sentry: true,
                sentryExtras: { compression: config.compression, encoding: config.encoding },
            });
            return { kind: 'failed', reason: `unsupported encoding (${config.encoding})` };
        }

        return { bytes, kind: 'decoded', text: toDocumentText(text, config.format) };
    } catch (error) {
        const reason = toDecodeFailureReason(error);
        Logger.error(new Error('[pmp:decode-payload] failed to decode', { cause: error }), {
            compression: config.compression,
            encoding: config.encoding,
            reason,
        });
        return { kind: 'failed', reason };
    }
}

/**
 * Signal that unwinds the inflate loop from inside pako's `onData`.
 */
class UnpackOverflow extends Error {}
const UNPACK_OVERFLOW_ERROR = new UnpackOverflow('[pmp:decode-payload] unpack exceeded its output limit');

/**
 * `incomplete` is its own outcome rather than an error, because pako reports it by NOT ending: a truncated stream
 * leaves `err` at zero and simply never reaches the end of the stream. That is the state `uncompressData` turns
 * into a silent `undefined`, which used to surface as a TypeError from the length check below it.
 */
type BoundedUnpackResult =
    | { kind: 'ok'; bytes: Uint8Array }
    | { kind: 'overflow'; limit: number }
    | { kind: 'incomplete' }
    | { kind: 'error'; reason: string };

/**
 * Inflates a gzip or zlib stream, refusing to produce more than `limit` bytes.
 *
 * Stands in for `uncompressData`, which is a switch over `pako.ungzip`/`pako.inflate` - the SAME autodetecting
 * function in pako 2.x, and the one this calls, so one path covers both compressions. What it adds is a bound on
 * the OUTPUT: pako has no `maxOutputLength`, so the library helper allocates whatever the stream expands to before
 * any caller can measure it. `onData` fires once per output chunk, so the check here runs DURING the inflate and
 * peak allocation is `limit` plus one 64 KB chunk. Measured against a stream expanding to 100 MB: ~6 ms holding
 * ~1 MB, where the unbounded call took ~240 ms and allocated all 100 MB.
 *
 * Never throws. The library helper signals a corrupt stream by throwing a bare string and an incomplete one by
 * returning `undefined`, and both arrive here as a typed result instead.
 */
function unpackBounded(data: Uint8Array, limit: number): BoundedUnpackResult {
    const inflator = new Inflate();
    const chunks: Uint8Array[] = [];
    let total = 0;
    let overflow = false;
    let ended = false;

    // Deliberately does not call through to pako's own `onData`, which leaves its internal chunk list empty. That
    // is what makes the `onEnd` call-through below free: it flattens nothing instead of copying the payload again.
    inflator.onData = chunk => {
        const data = bytes(chunk);
        total += data.length;
        if (total > limit) {
            overflow = true;
            throw UNPACK_OVERFLOW_ERROR;
        }
        chunks.push(data);
    };

    // `err` and `msg` are assigned by pako's own `onEnd`, so it still has to run. `ended` records that it ran at
    // all, which is the only signal for a truncated stream: pako sets no error there, it just never ends.
    const fillErrAndMsg = inflator.onEnd.bind(inflator);
    inflator.onEnd = status => {
        ended = true;
        fillErrAndMsg(status);
    };

    try {
        inflator.push(data, true);
    } catch (error) {
        if (error !== UNPACK_OVERFLOW_ERROR) throw error;
    }

    if (overflow) return { kind: 'overflow', limit };
    if (inflator.err !== 0) return { kind: 'error', reason: inflator.msg || `inflate error ${inflator.err}` };
    if (!ended) return { kind: 'incomplete' };

    // A stream that decompresses to nothing emits no chunk at all, so this is an empty payload, not a failure.
    return { bytes: concat(chunks), kind: 'ok' };
}

/** Not every decoder throws an Error: pako threw bare strings before the unpack moved in-house, so this stays. */
function toDecodeFailureReason(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'unknown decode error';
}

/**
 * Renders an already-decoded payload string for display.
 * Only `Json` is re-serialised with indentation so a minified document is readable.
 * Yaml/Toml/None stay verbatim - no parser library is pulled in.
 */
export function toDocumentText(text: string, format: Format): string {
    if (format !== Format.Json) {
        return text;
    }
    try {
        // Every JSON value stringifies back to a string, scalars included, so no shape needs special-casing.
        return JSON.stringify(JSON.parse(text), undefined, 2);
    } catch (error) {
        Logger.debug('[pmp:decode-payload] payload declares Format.Json but does not parse as JSON', { error });
        return text;
    }
}
