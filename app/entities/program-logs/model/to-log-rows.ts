import type { Cluster } from '@utils/cluster';
import { capitalizeFirstLetter } from '@utils/index';
import type { ProgramError } from '@utils/program-err';
import { getProgramName } from '@utils/tx';

import { pairLogsWithInstructions } from './pair-logs-with-instructions';
import type { Invocation, InvocationEntry, ParsedProgramLogs } from './parse-program-logs';

/** What the Logs card shows for one instruction. */
export type LogRow = {
    lines: LogLine[];
    // `none` for an instruction that logged nothing and did not fail.
    status: 'failed' | 'success' | 'none';
};

type LogLine = {
    text: string;
    prefix: string;
    style: 'muted' | 'info' | 'success' | 'warning';
};

/** Returns one row for each instruction, in transaction order. */
export function toInstructionLogRows({
    cluster,
    error,
    instructions,
    logs,
}: {
    cluster: Cluster;
    error: ProgramError | undefined;
    // `undefined` when the caller cannot list the instructions. Each top-level invocation then gets a row.
    instructions: readonly { programId: { toBase58(): string } }[] | undefined;
    logs: ParsedProgramLogs;
}): LogRow[] {
    const invocations = instructions
        ? pairLogsWithInstructions(
              logs.invocations,
              instructions.map(instruction => instruction.programId.toBase58()),
          )
        : logs.invocations;

    // An instruction can fail before any program logs a line.
    if (invocations.length === 0 && error) {
        return [toLogRow({ cluster, invocation: undefined, runtimeError: error.message })];
    }

    return invocations.map((invocation, index) =>
        toLogRow({ cluster, invocation, runtimeError: error?.index === index ? error.message : undefined }),
    );
}

function toLogRow({
    cluster,
    invocation,
    runtimeError,
}: {
    cluster: Cluster;
    invocation: Invocation | undefined;
    // The message of the transaction error, for the instruction that the error names.
    runtimeError: string | undefined;
}): LogRow {
    const lines = invocation ? toLogLines(invocation, cluster) : [];
    if (invocation && hasFailed(invocation)) return { lines, status: 'failed' };
    if (runtimeError === undefined) return { lines, status: invocation ? 'success' : 'none' };

    // A builtin can fail with no line in the logs.
    return {
        lines: [...lines, { prefix: PREFIX, style: 'warning', text: `Runtime error: ${runtimeError}` }],
        status: 'failed',
    };
}

const PREFIX = '> ';
const INDENT = '\u00A0\u00A0';

function toLogLines(invocation: Invocation, cluster: Cluster): LogLine[] {
    return invocation.entries.flatMap((entry): LogLine[] => {
        if (entry.kind !== 'invocation') return [{ prefix: PREFIX, ...toStyledText(entry) }];

        const programName = getProgramName(entry.invocation.programAddress, cluster);
        return [
            { prefix: PREFIX, style: 'info', text: `Program invoked: ${programName}` },
            ...toLogLines(entry.invocation, cluster).map(line => ({ ...line, prefix: INDENT + line.prefix })),
        ];
    });
}

function hasFailed(invocation: Invocation): boolean {
    return invocation.entries.some(entry =>
        entry.kind === 'invocation' ? hasFailed(entry.invocation) : entry.kind === 'failed' || entry.kind === 'error',
    );
}

function toStyledText(entry: Exclude<InvocationEntry, { kind: 'invocation' }>): Pick<LogLine, 'style' | 'text'> {
    switch (entry.kind) {
        case 'log':
            return { style: 'muted', text: `Program logged: "${entry.text}"` };
        case 'data':
            return { style: 'muted', text: `Program data: ${entry.text}` };
        case 'consumed':
            return { style: 'muted', text: `Program consumed: ${entry.text}` };
        case 'success':
            return { style: 'success', text: 'Program returned success' };
        case 'failed':
            return { style: 'warning', text: `Program returned error: "${entry.text}"` };
        case 'error':
            return { style: 'warning', text: toErrorText(entry.text) };
        case 'text':
            return { style: 'muted', text: entry.text };
    }
}

function toErrorText(text: string): string {
    if (text.startsWith('failed')) return capitalizeFirstLetter(text);
    return `Program returned error: "${text.slice(text.indexOf(': ') + 2)}"`;
}
