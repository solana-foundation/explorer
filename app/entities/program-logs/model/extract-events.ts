import { isValidBase64 } from '@shared/lib/bytes';

import { pairLogsWithInstructions } from './pair-logs-with-instructions';
import { type Invocation, type InvocationEntry, parseProgramLogs } from './parse-program-logs';

export type ProgramEventPayload = { data: string; kind: 'data' | 'log' };

export function extractEventsFromLogs({
    childIndex,
    index,
    instructionProgramIds,
    logs,
}: {
    childIndex?: number;
    index: number;
    instructionProgramIds: string[];
    logs: string[];
}): ProgramEventPayload[] {
    const topLevel = pairLogsWithInstructions(parseProgramLogs(logs).invocations, instructionProgramIds)[index];
    if (!topLevel) return [];

    const invocation = childIndex === undefined ? topLevel : toInnerInvocations(topLevel)[childIndex];
    return invocation?.entries.flatMap(toPayloads) ?? [];
}

// Depth-first, in log order: the order that numbers the inner instructions of a transaction.
function toInnerInvocations(invocation: Invocation): Invocation[] {
    return invocation.entries.flatMap(entry =>
        entry.kind === 'invocation' ? [entry.invocation, ...toInnerInvocations(entry.invocation)] : [],
    );
}

function toPayloads(entry: InvocationEntry): ProgramEventPayload[] {
    if (entry.kind === 'data') return [{ data: entry.text.trim(), kind: 'data' }];
    if (entry.kind !== 'log') return [];

    const payload = entry.text.trim();
    return isLikelyBase64Event(payload) ? [{ data: payload, kind: 'log' }] : [];
}

const ANCHOR_DISCRIMINATOR_BASE64_LENGTH = 12;

function isLikelyBase64Event(payload: string): boolean {
    return payload.length >= ANCHOR_DISCRIMINATOR_BASE64_LENGTH && payload.length % 4 === 0 && isValidBase64(payload);
}
