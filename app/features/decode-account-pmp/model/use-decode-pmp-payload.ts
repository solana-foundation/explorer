'use client';

import { decodePmpPayload, type MetadataAccount, type PmpDecodedPayload } from '@entities/pmp-account';
import React from 'react';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

/**
 * `idle` is a kind with nothing to decode (Buffer, Empty, unreadable), plus the frame a Metadata card paints before
 * its effect runs - effects run after paint, so that frame is what shows the loader. `failed` is the decode CALL
 * throwing: `decodePmpPayload` returns its failures rather than throwing, so nothing reaches it today.
 *
 * `ready` carries a PAYLOAD, not a whole account: the header has already been read by the time this state exists,
 * so the account-level outcomes it would otherwise repeat are settled.
 */
export type PmpDecodeState =
    | { status: 'idle' }
    | { status: 'failed' }
    | { status: 'ready'; payload: PmpDecodedPayload };

/**
 * Runs the payload decode off the render path, and re-runs it whenever the account changes. Keyed by the decoded
 * account rather than by the address: the account page's own card sits above this tab and can replace these bytes
 * at any time, and a result cached by address would then describe bytes that are gone.
 *
 * Takes the ALREADY-DECODED struct, so the struct decode `readPmpAccountHeader` did in the render memo is not
 * repeated here. That struct is also structurally a `PmpDecodeConfig` - it carries `encoding`, `compression` and
 * `format` - so it is passed straight through as the config.
 */
export function useDecodePmpPayload(account: MetadataAccount | undefined): PmpDecodeState {
    const [state, setState] = React.useState<PmpDecodeState>({ status: 'idle' });

    React.useEffect(() => {
        if (!account) {
            setState({ status: 'idle' });
            return;
        }

        try {
            // `data` is a remainder, so an `extend`-ed account carries slack past the payload; `dataLength` is what
            // the program treats as the body. Copied out, so the card does not retain a view into the provider's
            // Node Buffer pool.
            const body = bytes(account.data.subarray(0, account.dataLength));
            setState({ payload: decodePmpPayload({ config: account, data: body }), status: 'ready' });
        } catch (error) {
            // `decodePmpPayload` returns its failures rather than throwing, so nothing reaches this today. It stays
            // because a throw here would otherwise leave the card stuck on its loader forever.
            Logger.error(new Error('[pmp:account-card] payload decode error', { cause: error }), {
                sentry: true,
            });
            setState({ status: 'failed' });
        }
    }, [account]);

    return state;
}
