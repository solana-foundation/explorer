import { type ConnectableUrl, getRpc } from '@entities/cluster';
import { type Cluster } from '@utils/cluster';

import { Logger } from '@/app/shared/lib/logger';
import { ROUTE_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { parseSupplyPayload, type Supply, toSupply } from '../lib/supply';

/** Carries whether asking again could answer differently, judged where the response is in hand. */
export class SupplyFetchError extends Error {
    readonly name = 'SupplyFetchError';
    readonly retryable: boolean;

    constructor(message: string, options: { cause?: unknown; retryable: boolean }) {
        super(message, { cause: options.cause });
        this.retryable = options.retryable;
    }
}

/** An error from anywhere else is most likely the connection, which is worth another go. */
export function isRetryableSupplyError(error: unknown): boolean {
    return error instanceof SupplyFetchError ? error.retryable : true;
}

/** Throws rather than falling back to zeros, which callers read as a real answer. */
export async function fetchSupplyFromRoute(cluster: Cluster): Promise<Supply> {
    const response = await fetch(`/api/supply?cluster=${cluster}`, {
        // Without one, a connection that is accepted and never answered leaves the card spinning for good.
        signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS),
    });

    if (!response.ok) {
        const retryable = RETRYABLE_STATUSES.has(response.status);
        const error = new SupplyFetchError(`/api/supply returned ${response.status}`, { retryable });
        // The one answer the route cannot have reported: it refuses a caller's input silently, since anyone
        // can provoke that. Warned, not errored — the bot gate ahead of it refuses visitors it misjudges.
        if (response.status < 500 && !retryable) {
            Logger.warn('[supply] /api/supply refused the request', {
                sentry: true,
                sentryExtras: { cluster, status: response.status },
            });
        }
        throw error;
    }

    // A body cut short is the connection, not a disagreement, so it is worth another go and worth nobody's
    // attention.
    let body: unknown;
    try {
        body = await response.json();
    } catch (cause) {
        throw new SupplyFetchError('[supply] /api/supply answered with an unreadable body', {
            cause,
            retryable: true,
        });
    }

    try {
        return parseSupplyPayload(body);
    } catch (cause) {
        // The server thinks it succeeded, so this is the one failure only we can see — and asking again
        // would just report the same disagreement.
        const error = new SupplyFetchError('[supply] /api/supply returned a body the client cannot read', {
            cause,
            retryable: false,
        });
        Logger.error(error, {
            sentry: true,
            sentryExtras: { cluster, parseError: cause instanceof Error ? cause.message : String(cause) },
        });
        throw error;
    }
}

/** For endpoints the server cannot or must not reach, the browser asks them itself. */
export async function fetchSupplyFromRpc(url: ConnectableUrl): Promise<Supply> {
    const { value } = await getRpc(url)
        .getSupply({ commitment: 'finalized', excludeNonCirculatingAccountsList: true })
        .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });

    return toSupply(value);
}

// Asking again can only answer differently for these: the route's transient upstream error and its
// deadline, plus a rate limit from anything standing in front of it. Its other answers wait on someone
// changing configuration, and a rate limit is nobody's bug, so it is not reported either.
const RETRYABLE_STATUSES = new Set([429, 503, 504]);
