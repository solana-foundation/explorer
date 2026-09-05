'use client';

import type { BufferAccount } from '@entities/pmp-account';
import React from 'react';

import { bytes } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import {
    type ConfigResolutionFromBytesResult,
    resolveBufferConfigFromBytes,
} from '../lib/config-resolution/resolve-buffer-config-from-bytes';

export type ConfigResolutionFromBytesState =
    { status: 'idle' } | { status: 'failed' } | { status: 'ready'; result: ConfigResolutionFromBytesResult };

/**
 * Tries to decode config for a Buffer account from its bytes.
 */
export function useResolveBufferConfigFromBytes(account: BufferAccount | undefined): ConfigResolutionFromBytesState {
    const [state, setState] = React.useState<ConfigResolutionFromBytesState>({ status: 'idle' });

    React.useEffect(() => {
        if (!account) {
            setState({ status: 'idle' });
            return;
        }

        try {
            // A Buffer has no `dataLength`, so `data` IS the body, trailing slack and all - which is exactly why
            // detection owns a slack trim. Copied out, so the card does not retain a view into the provider's
            // Node Buffer pool.
            setState({ result: resolveBufferConfigFromBytes(bytes(account.data)), status: 'ready' });
        } catch (error) {
            // `resolveBufferConfigFromBytes` returns its failures rather than throwing, so nothing reaches this today. It
            // stays because a throw here would otherwise leave the card stuck on its loader forever.
            Logger.error(new Error('[pmp:account-card] buffer detection error', { cause: error }), { sentry: true });
            setState({ status: 'failed' });
        }
    }, [account]);

    return state;
}
