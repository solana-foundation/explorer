import { AccountDiscriminator, getBufferDecoder, getMetadataDecoder } from '@solana-program/program-metadata';

import { Logger } from '@/app/shared/lib/logger';

import { toErrorReason } from './errors';
import type { PmpAccountReadResult, PmpAccountSnapshot } from './types';
import { validatePmpAccountBytes } from './validate-pmp-account-bytes';

/**
 * Decodes a PMP account into its generated struct. No payload decoding.
 * Pure - the caller supplies the already-fetched account. Never throws: every failure comes back as `unreadable`.
 */
export function readPmpAccount({ account }: { account: PmpAccountSnapshot }): PmpAccountReadResult {
    const accountBytesResult = validatePmpAccountBytes({ account });
    if (accountBytesResult.kind !== 'ok') return accountBytesResult;

    const { data } = accountBytesResult;

    try {
        switch (data[0]) {
            case AccountDiscriminator.Buffer: {
                return { account: getBufferDecoder().decode(data), kind: 'buffer' };
            }
            case AccountDiscriminator.Metadata: {
                return { account: getMetadataDecoder().decode(data), kind: 'metadata' };
            }
            case AccountDiscriminator.Empty: {
                // Allocated and not written yet.
                // An ordinary state, so it is reported to the reader and nowhere else
                // Reading it as a payload would decode padding as content.
                return { kind: 'empty' };
            }
            default: {
                Logger.warn('[pmp:read-account] unknown PMP account discriminator', {
                    sentry: true,
                    sentryExtras: { discriminator: data[0], length: data.length },
                });
                return { kind: 'unreadable', reason: `unknown account layout (discriminator ${data[0]})` };
            }
        }
    } catch (error) {
        // Only the PMP program writes these headers and it validates its own enums, so an out-of-range hint means
        // the layout this module decodes has drifted from the program's - that is ours, so it goes to Sentry.
        Logger.error(new Error('[pmp:read-account] PMP header decode error', { cause: error }), {
            sentry: true,
            sentryExtras: { discriminator: data[0], length: data.length },
        });
        return { kind: 'unreadable', reason: toErrorReason(error, 'unknown header decode error') };
    }
}
