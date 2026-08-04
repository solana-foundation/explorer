import type { ReadonlyUint8Array } from '@solana/kit';
import { AccountDiscriminator, getBufferDecoder, getMetadataDecoder } from '@solana-program/program-metadata';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { PMP_ACCOUNT_HEADER_LEN, PMP_ADDRESS } from './constants';
import { decodePmpPayload } from './decode-pmp-payload';
import type { PmpAccountContent, PmpAccountKind, PmpAccountSnapshot, PmpDecodeConfig } from './types';

/**
 * Decodes the payload a PMP account currently holds, for the instructions that carry no inline bytes: a `setData`
 * whose payload came from a foreign buffer, and an `initialize` that finalized bytes pre-written to its metadata
 * PDA. Pure - the caller supplies the already-fetched account.
 *
 * This reads CURRENT state. It is not a reconstruction of what the viewed transaction wrote, and it makes no
 * attempt to be: no write history, no execution-position bound, no length derivation. The UI says so.
 *
 * `config` is used only for a Buffer account, whose header carries no encoding/compression/format of its own. A
 * Metadata account carries its own hints, and those are the ones that match the bytes it currently holds.
 */
export function decodePmpBufferAccount({
    account,
    config,
    cap,
}: {
    account: PmpAccountSnapshot;
    config: PmpDecodeConfig;
    cap?: number;
}): PmpAccountContent {
    const { data, lamports, owner } = account;

    // The accounts provider models "no such account" as zero lamports plus an empty raw buffer, which is exactly
    // what a closed PMP buffer leaves behind. No account can hold data at zero lamports, so this is unambiguous.
    if (lamports === 0 && (data === undefined || data.length === 0)) return { kind: 'absent' };

    if (owner !== PMP_ADDRESS) {
        return {
            kind: 'unreadable',
            reason: `the account is owned by ${owner}, not the Program Metadata Program`,
        };
    }

    if (data === undefined) {
        return { kind: 'unreadable', reason: 'the account was fetched without its data' };
    }

    if (data.length < PMP_ACCOUNT_HEADER_LEN) {
        return {
            kind: 'unreadable',
            reason: `the account is shorter than the ${PMP_ACCOUNT_HEADER_LEN}-byte header`,
        };
    }

    try {
        switch (data[0]) {
            case AccountDiscriminator.Buffer: {
                // A buffer has no length field: its body runs to the end of the account, which is what the
                // remainder decoder hands back.
                const bufferData = getBufferDecoder().decode(data).data;
                return decodeAccountContent('buffer', config, bufferData, cap);
            }
            case AccountDiscriminator.Metadata: {
                const metadata = getMetadataDecoder().decode(data);
                // The `data` field is a REMAINDER, so an account grown by `extend` and never trimmed carries
                // slack past the payload. `dataLength` is what the program itself treats as the payload.
                const bufferData = metadata.data.subarray(0, metadata.dataLength);
                const accountConfig = {
                    compression: metadata.compression,
                    encoding: metadata.encoding,
                    format: metadata.format,
                };
                return decodeAccountContent('metadata', accountConfig, bufferData, cap);
            }
            case AccountDiscriminator.Empty: {
                // Allocated and not written yet. An ordinary state, so it is reported to the reader and nowhere
                // else - but reading it as a payload would still decode padding as content.
                return noPayloadContent(data[0]);
            }
            default: {
                Logger.warn('[pmp:decode-account] unknown PMP account discriminator', {
                    sentry: true,
                    sentryExtras: { discriminator: data[0], length: data.length },
                });
                return noPayloadContent(data[0]);
            }
        }
    } catch (error) {
        Logger.error(new Error('[pmp:decode-account] PMP account decode error', { cause: error }), {
            sentry: true,
            sentryExtras: { discriminator: data[0], length: data.length },
        });
        return { kind: 'unreadable', reason: toReason(error) };
    }
}

function noPayloadContent(discriminator: number): PmpAccountContent {
    return { kind: 'unreadable', reason: `the account holds no PMP payload (discriminator ${discriminator})` };
}

/**
 * The body is copied out rather than kept as a view. The provider hands back web3.js's Node `Buffer`, so every
 * slice of it is a `Buffer` sitting at an offset into Node's shared allocation pool - which would leak that
 * pool's lifetime and `Buffer`'s own `toJSON` into everything downstream, exactly as the inline path avoids.
 */
function decodeAccountContent(
    account: PmpAccountKind,
    config: PmpDecodeConfig,
    data: ReadonlyUint8Array,
    cap: number | undefined,
): PmpAccountContent {
    const body = bytes(data);
    const payload = decodePmpPayload({ cap, config, data: body });
    return { account, body, config, kind: 'payload', payload };
}

/** The generated decoders throw plain Errors, but a non-Error throw stays handled rather than read as `undefined`. */
function toReason(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'unknown account decode error';
}
