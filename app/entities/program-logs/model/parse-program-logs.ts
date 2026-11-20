export type ParsedProgramLogs = {
    // The top-level invocations, in log order.
    invocations: Invocation[];
    truncated: boolean;
};

export type Invocation = {
    // `undefined` when no `invoke` line precedes the lines.
    programAddress: string | undefined;
    // The figure of the "consumed" line. A builtin logs no such line.
    computeUnits: number | undefined;
    entries: InvocationEntry[];
};

// An `invoke` line opens every inner invocation.
type InnerInvocation = Invocation & { programAddress: string };

export type InvocationEntry =
    | { kind: 'invocation'; invocation: InnerInvocation }
    | { kind: 'success' }
    | { kind: 'consumed' | 'data' | 'error' | 'failed' | 'log' | 'text'; text: string };

/** Builds the invocation tree of a transaction's log lines. Accepts any lines, in any order, without an error. */
export function parseProgramLogs(lines: readonly string[]): ParsedProgramLogs {
    const invocations: Invocation[] = [];
    const stack: Invocation[] = [];
    let truncated = false;

    for (const line of lines) {
        if (line.startsWith('Log truncated')) {
            truncated = true;
            continue;
        }

        const invoke = line.match(INVOKE);
        if (invoke) {
            // The depth in the line closes an invocation that logged no status line.
            stack.length = Math.max(0, Math.min(stack.length, Number(invoke[2]) - 1));
            const invocation: InnerInvocation = { computeUnits: undefined, entries: [], programAddress: invoke[1] };
            const parent = stack.at(-1);
            if (parent) parent.entries.push({ invocation, kind: 'invocation' });
            else invocations.push(invocation);
            stack.push(invocation);
            continue;
        }

        const entry = toEntry(line);
        // The runtime can write an error after the status line of the invocation that caused it.
        let invocation = stack.at(-1) ?? (entry.kind === 'error' ? invocations.at(-1) : undefined);
        if (!invocation) {
            invocation = { computeUnits: undefined, entries: [], programAddress: undefined };
            invocations.push(invocation);
            stack.push(invocation);
        }

        invocation.entries.push(entry);
        if (entry.kind === 'consumed') invocation.computeUnits = Number.parseInt(entry.text);
        if (entry.kind === 'success' || entry.kind === 'failed') stack.pop();
    }

    return { invocations, truncated };
}

/** Returns the compute units that the top-level invocations logged, or `undefined` for logs with no invocation. */
export function getLoggedComputeUnits({ invocations }: ParsedProgramLogs): number | undefined {
    if (invocations.length === 0) return undefined;

    return invocations.reduce((sum, invocation) => sum + (invocation.computeUnits ?? 0), 0);
}

/* eslint-disable no-restricted-syntax -- the runtime writes these lines in a fixed format */
const INVOKE = /^Program (\w+) invoke \[(\d+)\]/;
const CONSUMED = /^Program \w+ consumed (\d+ .*)/;
const SUCCESS = /^Program \w+ success/;
const FAILED = /^Program \w+ failed: (.*)/;
/* eslint-enable no-restricted-syntax */

const LOG_PREFIX = 'Program log: ';
const DATA_PREFIX = 'Program data: ';

function toEntry(line: string): InvocationEntry {
    if (line.startsWith(LOG_PREFIX)) return { kind: 'log', text: line.slice(LOG_PREFIX.length) };
    if (line.startsWith(DATA_PREFIX)) return { kind: 'data', text: line.slice(DATA_PREFIX.length) };

    const consumed = line.match(CONSUMED);
    if (consumed) return { kind: 'consumed', text: consumed[1] };
    if (SUCCESS.test(line)) return { kind: 'success' };

    const failed = line.match(FAILED);
    if (failed) return { kind: 'failed', text: failed[1] };

    // The runtime writes an error outside the "failed" status line, for example "Program failed to complete".
    return { kind: line.includes('failed') ? 'error' : 'text', text: line };
}
