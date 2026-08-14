import type { ReadonlyUint8Array } from '@solana/kit';

import { bytes } from '@/app/shared/lib/bytes';

import { decodePmpPayload } from './decode-pmp-payload';
import { readPmpAccount } from './read-pmp-account';
import type { PmpAccountDecodeResult, PmpAccountKind, PmpAccountSnapshot, PmpDecodeConfig } from './types';

/**
 * Decodes the account AND its data payload.
 * `config` is used only for a Buffer account, whose header carries no encoding/compression/format of its own.
 * A Metadata account carries its own config, and those are the ones that match the bytes it currently holds.
 */
export function decodePmpAccount({
    account,
    config,
    cap,
}: {
    account: PmpAccountSnapshot;
    /**
     * Omitted by the account page, which has no instruction to take decode-config from. A Metadata account carries its
     * own, so this only decides whether a BUFFER body can be decoded at all.
     */
    config?: PmpDecodeConfig;
    cap?: number;
}): PmpAccountDecodeResult {
    const pmpAccountResult = readPmpAccount({ account });

    switch (pmpAccountResult.kind) {
        case 'buffer': {
            // A Buffer header stores no encoding/compression/format and, at program-source level, never can.
            // Without an instruction to take them from there is nothing to decode with, and guessing would render
            // invented content. The account page recovers them separately, via detection plus a history lookup.
            if (!config) {
                return { kind: 'unreadable', reason: 'a Buffer account header carries no decode config' };
            }
            // A buffer has no length field: its body runs to the end of the account, which is what the remainder
            // decoder already handed back.
            return decodeAccountContent('buffer', config, pmpAccountResult.account.data, cap);
        }
        case 'metadata': {
            const { compression, data, dataLength, encoding, format } = pmpAccountResult.account;
            // `data` is a REMAINDER, so an account grown by `extend` and never trimmed carries slack past the
            // payload. `dataLength` is what the program itself treats as the payload.
            return decodeAccountContent(
                'metadata',
                { compression, encoding, format },
                data.subarray(0, dataLength),
                cap,
            );
        }
        // Passed through verbatim, `empty` included. It is an ordinary allocated-but-unwritten account rather than a
        // failure, so demoting it to `unreadable` here would make every card warn about a normal state.
        case 'empty':
        case 'absent':
        case 'unreadable':
            return pmpAccountResult;
    }
}

function decodeAccountContent(
    account: PmpAccountKind,
    config: PmpDecodeConfig,
    data: ReadonlyUint8Array,
    cap: number | undefined,
): PmpAccountDecodeResult {
    const body = bytes(data);
    const payload = decodePmpPayload({ cap, config, data: body });
    return { account, body, config, kind: 'payload', payload };
}
