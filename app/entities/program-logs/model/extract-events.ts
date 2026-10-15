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
 * Precompiles log no `invoke` line, so matching instruction `index` needs `programIds` to skip them.
 * `programIds` lists the program id of each top-level instruction, in order.
 */
export function extractEventsFromLogs({
    childIndex,
    index,
    logs,
    programIds,
}: {
    childIndex?: number;
    index: number;
    logs: string[];
    programIds?: string[];
}): ProgramEventPayload[] {
    const events: ProgramEventPayload[] = [];
    let currentIxIndex = -1;
    const frames: (number | 'top-level')[] = [];
    let childCount = 0;

    for (const log of logs) {
        // eslint-disable-next-line no-restricted-syntax -- match program invoke pattern
        const invoke = log.match(/^Program (\w+) invoke \[\d+\]/);
        if (invoke) {
            if (frames.length === 0) {
                if (programIds) {
                    // Advance to the next top-level instruction using this program, skipping any
                    // non-logging instructions (precompiles) between the previous one and this.
                    let i = currentIxIndex + 1;
                    while (i < programIds.length && programIds[i] !== invoke[1]) i++;
                    currentIxIndex = i < programIds.length ? i : currentIxIndex + 1;
                } else {
                    currentIxIndex++;
                }
                childCount = 0;
                frames.push('top-level');
            } else {
                frames.push(childCount++);
            }
            // eslint-disable-next-line no-restricted-syntax -- match program status pattern
        } else if (/^Program (?:\w+ (?:success|failed)|failed)/.test(log)) {
            frames.pop();
        } else if (currentIxIndex === index && frames.at(-1) === (childIndex ?? 'top-level')) {
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
