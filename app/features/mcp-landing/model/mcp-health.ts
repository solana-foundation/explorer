import { array, is, string, type } from 'superstruct';

import { MCP_ENDPOINT_PATH } from './constants';

export type McpHealthStatus = 'disabled' | 'ready' | 'unreachable';

export interface McpHealth {
    latencyMs: number;
    status: McpHealthStatus;
}

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
    const elapsed = () => Math.round(performance.now() - startedAt);

    try {
        // Relative on purpose: the check reports whether *this* deployment answers, not the canonical host the snippets name.
        const response = await fetch(MCP_ENDPOINT_PATH, {
            body: JSON.stringify(PING_REQUEST),
            // Both media types are mandatory; `application/json` alone is answered with a 406.
            headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
            method: 'POST',
        });

        if (response.status === 503) {
            return { latencyMs: elapsed(), status: 'disabled' };
        }
        if (!response.ok) {
            return { latencyMs: elapsed(), status: 'unreachable' };
        }

        const body: unknown = await response.json();
        return { latencyMs: elapsed(), status: isPong(body) ? 'ready' : 'unreachable' };
    } catch {
        return { latencyMs: elapsed(), status: 'unreachable' };
    }
}
