import { isValidBase64 } from '@shared/lib/bytes';

// A `Program log:` payload that looks like a base64-encoded event: at least the 8-byte discriminator
// (≥12 base64 chars, a multiple of 4) and valid base64. Plain-text logs fail the codec check; any
// straggler is rejected by the event decoder.
function isLikelyBase64Event(payload: string): boolean {
    return payload.length >= 12 && payload.length % 4 === 0 && isValidBase64(payload);
}

/**
 * A base64-encoded event payload tagged by emission style: `data` = `Program data:` (Anchor
 * `sol_log_data`, definitively structured), `log` = base64 logged via `Program log:` (a heuristic
 * guess). The tag lets callers treat an undecodable `data` payload as an "Unknown Event" while dropping
 * an undecodable `log` payload (likely a non-event base64 log).
 */
export type ProgramEventPayload = { data: string; kind: 'data' | 'log' };

/**
 * Extracts event payloads from transaction logs for a specific instruction.
 *
 * Handles both event-emission styles (see {@link ProgramEventPayload}). When `programIds` (the ordered
 * top-level instruction program ids) is provided, invocations are matched to their instruction by
 * program id so instructions that emit no `invoke` log — the ed25519/secp256k1 precompiles — don't
 * shift the index. Without it, falls back to counting top-level invocations.
 */
export function extractEventsFromLogs(
    logs: string[],
    instructionIndex: number,
    programIds?: string[],
): ProgramEventPayload[] {
    const events: ProgramEventPayload[] = [];
    let currentIxIndex = -1;
    let depth = 0;

    for (const log of logs) {
        // eslint-disable-next-line no-restricted-syntax -- match program invoke pattern
        const invoke = log.match(/^Program (\w+) invoke \[\d+\]/);
        if (invoke) {
            if (depth === 0) {
                if (programIds) {
                    // Advance to the next top-level instruction using this program, skipping any
                    // non-logging instructions (precompiles) between the previous one and this.
                    let i = currentIxIndex + 1;
                    while (i < programIds.length && programIds[i] !== invoke[1]) i++;
                    currentIxIndex = i < programIds.length ? i : currentIxIndex + 1;
                } else {
                    currentIxIndex++;
                }
            }
            depth++;
            // eslint-disable-next-line no-restricted-syntax -- match program status pattern
        } else if (/^Program (?:\w+ (?:success|failed)|failed)/.test(log)) {
            // Anchor on the `Program <id> success/failed` format so user log text or a `Program data:`
            // base64 payload containing the substring "success"/"failed" can't decrement depth.
            depth--;
        } else if (currentIxIndex === instructionIndex) {
            if (log.startsWith('Program data:')) {
                events.push({ data: log.slice('Program data: '.length).trim(), kind: 'data' });
            } else if (log.startsWith('Program log:')) {
                const payload = log.slice('Program log: '.length).trim();
                if (isLikelyBase64Event(payload)) events.push({ data: payload, kind: 'log' });
            }
        }
    }

    return events;
}
