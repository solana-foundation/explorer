import { AccountDiscriminator, getBufferDecoder, getMetadataDecoder } from '@solana-program/program-metadata';

import { Logger } from '@/app/shared/lib/logger';

import { toErrorReason } from './errors';
import { readPmpAccountBytes } from './read-pmp-account-bytes';
import type { PmpAccountHeader, PmpAccountSnapshot } from './types';

/**
 * Reads the 96-byte PMP header and nothing else: no inflate, no `JSON.parse`, no decode budget. The account page
 * needs the identity fields on mount, and the payload decode is what stays behind a click - the largest real
 * document observed inflates from 5896 stored bytes to 104798, which no reader who wanted the address should pay.
 *
 * Pure - the caller supplies the already-fetched account. Never throws: every failure comes back as `unreadable`.
 */
export function readPmpAccountHeader({ account }: { account: PmpAccountSnapshot }): PmpAccountHeader {
    const accountBytes = readPmpAccountBytes({ account });
    if (accountBytes.kind !== 'ok') return accountBytes;

    const { data } = accountBytes;

    try {
        switch (data[0]) {
            // Both arms hand back the generated struct as-is. Its `data` field is a REMAINDER, so an account grown
            // by `extend` and never trimmed carries more bytes than `dataLength` - the card compares the two to
            // name a truncated account, and copies out of it rather than holding the view.
            case AccountDiscriminator.Buffer: {
                return { account: getBufferDecoder().decode(data), kind: 'buffer' };
            }
            case AccountDiscriminator.Metadata: {
                return { account: getMetadataDecoder().decode(data), kind: 'metadata' };
            }
            case AccountDiscriminator.Empty: {
                // Allocated and not written yet. An ordinary state, so it is reported to the reader and nowhere
                // else - but reading it as a payload would decode padding as content.
                return { kind: 'empty' };
            }
            default: {
                Logger.warn('[pmp:read-account-header] unknown PMP account discriminator', {
                    sentry: true,
                    sentryExtras: { discriminator: data[0], length: data.length },
                });
                return { kind: 'unreadable', reason: `unknown account layout (discriminator ${data[0]})` };
            }
        }
    } catch (error) {
        // Only the PMP program writes these headers and it validates its own enums, so an out-of-range hint means
        // the layout this module decodes has drifted from the program's - that is ours, so it goes to Sentry.
        Logger.error(new Error('[pmp:read-account-header] PMP header decode error', { cause: error }), {
            sentry: true,
            sentryExtras: { discriminator: data[0], length: data.length },
        });
        return { kind: 'unreadable', reason: toErrorReason(error, 'unknown header decode error') };
    }
}
