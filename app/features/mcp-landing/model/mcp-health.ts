import { array, is, string, type } from 'superstruct';

import { MCP_ENDPOINT_PATH } from './constants';

/** `degraded` means the endpoint answered but broke the tool contract — our bug, not the visitor's network. */
export type McpHealthStatus = 'degraded' | 'disabled' | 'ready' | 'unauthorized' | 'unreachable';

export type McpHealth =
    | { latencyMs: number; status: 'ready' }
    | {
          /** Diagnostic payload for the caller to report; never rendered. */
          cause?: unknown;
          /** One-line explanation to show next to the badge. */
          reason: string;
          status: Exclude<McpHealthStatus, 'ready'>;
      };

// A probe that outlives the route's own maxDuration tells us nothing the visitor can act on.
const TIMEOUT_MS = 10_000;

// The transport is stateless, so `tools/call` answers cold — no initialize, no session id to carry.
const PING_REQUEST = {
    id: 1,
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { arguments: {}, name: 'ping' },
};

const PongResponse = type({
    result: type({
        content: array(type({ text: string() })),
    }),
});

function isPong(body: unknown): boolean {
    return is(body, PongResponse) && body.result.content.some(item => item.text === 'pong');
}

/** Never throws — a failed check is a status, not an error, so callers can tell "disabled" from "unreachable". */
export async function checkMcpHealth(): Promise<McpHealth> {
    const startedAt = performance.now();

    try {
        // Relative on purpose: the check reports whether *this* deployment answers, not the canonical host the snippets name.
        const response = await fetch(MCP_ENDPOINT_PATH, {
            body: JSON.stringify(PING_REQUEST),
            // Both media types are mandatory; `application/json` alone is answered with a 406.
            headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
            method: 'POST',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (response.status === 503) {
            return { reason: 'This deployment has the MCP endpoint turned off.', status: 'disabled' };
        }
        if (response.status === 401 || response.status === 403) {
            return {
                reason: 'This deployment requires a bearer key, which the snippets below omit.',
                status: 'unauthorized',
            };
        }
        if (!response.ok) {
            return { reason: `The endpoint answered ${response.status}.`, status: 'unreachable' };
        }

        const body: unknown = await response.json();
        if (isPong(body)) {
            return { latencyMs: Math.round(performance.now() - startedAt), status: 'ready' };
        }
        return {
            cause: body,
            reason: 'The endpoint answered, but the ping tool did not reply pong.',
            status: 'degraded',
        };
    } catch (cause) {
        const timedOut = cause instanceof Error && cause.name === 'TimeoutError';
        return {
            cause,
            reason: timedOut ? 'The endpoint did not answer in time.' : 'The endpoint could not be reached.',
            status: 'unreachable',
        };
    }
}
