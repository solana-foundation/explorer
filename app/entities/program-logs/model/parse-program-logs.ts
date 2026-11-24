export type ParsedProgramLogs = {
    invocations: Invocation[];
    truncated: boolean;
};

export type Invocation = {
    programAddress: string | undefined;
    computeUnits: number | undefined;
    entries: InvocationEntry[];
};

type InnerInvocation = Invocation & { programAddress: string };

export type InvocationEntry =
    | { kind: 'invocation'; invocation: InnerInvocation }
    | { kind: 'success' }
    | { kind: 'consumed' | 'data' | 'error' | 'failed' | 'log' | 'text'; text: string };

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
            stack.length = Math.max(0, Math.min(stack.length, Number(invoke[2]) - 1));
            const invocation: InnerInvocation = { computeUnits: undefined, entries: [], programAddress: invoke[1] };
            const parent = stack.at(-1);
            if (parent) parent.entries.push({ invocation, kind: 'invocation' });
            else invocations.push(invocation);
            stack.push(invocation);
            continue;
        }

        const entry = toEntry(line);
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

    return { kind: line.includes('failed') ? 'error' : 'text', text: line };
}
