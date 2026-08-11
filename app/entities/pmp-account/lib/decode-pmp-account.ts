import type { ReadonlyUint8Array } from '@solana/kit';
import { AccountDiscriminator, getBufferDecoder, getMetadataDecoder } from '@solana-program/program-metadata';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { decodePmpPayload } from './decode-pmp-payload';
import { toErrorReason } from './errors';
import { readPmpAccountBytes } from './read-pmp-account-bytes';
import type { PmpAccountContent, PmpAccountKind, PmpAccountSnapshot, PmpDecodeConfig } from './types';

/**
 * Decodes the payload a PMP account currently holds. Pure - the caller supplies the already-fetched account, so
 * both the transaction page (reading the account a `setData` or `initialize` points at) and the account page
 * (reading the account being viewed) share one implementation.
 *
 * This reads CURRENT state. It is not a reconstruction of what any transaction wrote, and it makes no attempt to
 * be: no write history, no execution-position bound, no length derivation. The UI says so.
 *
 * `config` is used only for a Buffer account, whose header carries no encoding/compression/format of its own. A
 * Metadata account carries its own hints, and those are the ones that match the bytes it currently holds.
 */
export function decodePmpAccount({
    account,
    config,
    cap,
}: {
    account: PmpAccountSnapshot;
    /**
     * Omitted by the account page, which has no instruction to take hints from. A Metadata account carries its
     * own, so this only decides whether a BUFFER body can be decoded at all.
     */
    config?: PmpDecodeConfig;
    cap?: number;
}): PmpAccountContent {
    // Named `accountBytes` rather than `bytes`, which is the Uint8Array helper this module imports.
    const accountBytes = readPmpAccountBytes({ account });
    if (accountBytes.kind !== 'ok') return accountBytes;

    const { data } = accountBytes;

    try {
        switch (data[0]) {
            case AccountDiscriminator.Buffer: {
                // A Buffer header stores no encoding/compression/format and, at program-source level, never can.
                // Without an instruction to take them from there is nothing to decode with, and guessing would
                // render invented content. Recovering them from write history is PR 2's job.
                if (!config) {
                    return { kind: 'unreadable', reason: 'a Buffer account header carries no decode config' };
                }
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
        return { kind: 'unreadable', reason: toErrorReason(error, 'unknown account decode error') };
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
