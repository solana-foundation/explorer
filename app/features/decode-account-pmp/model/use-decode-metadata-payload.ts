'use client';

import { decodePmpPayload, type MetadataAccount, type PmpPayloadDecodeResult } from '@entities/pmp-account';
import React from 'react';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

export type MetadataPayloadDecodeResult =
    { status: 'idle' } | { status: 'failed' } | { status: 'ready'; payload: PmpPayloadDecodeResult };

/**
 * Decodes the payload of a Metadata account.
 */
export function useDecodeMetadataPayload(account: MetadataAccount | undefined): MetadataPayloadDecodeResult {
    const [state, setState] = React.useState<MetadataPayloadDecodeResult>({ status: 'idle' });

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
