import { isValidBase64 } from '@shared/lib/bytes';

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
    return attributePayloads(logs, instructionProgramIds)
        .filter(payload => payload.index === index && payload.childIndex === childIndex)
        .map(({ data, kind }) => ({ data, kind }));
}

type AttributedPayload = ProgramEventPayload & { childIndex: number | undefined; index: number };

// eslint-disable-next-line no-restricted-syntax -- match program invoke pattern
const INVOKE = /^Program (\w+) invoke \[\d+\]/;
// eslint-disable-next-line no-restricted-syntax -- match program status pattern
const STATUS = /^Program (?:\w+ (?:success|failed)|failed)/;

function attributePayloads(logs: string[], instructionProgramIds: string[]): AttributedPayload[] {
    const payloads: AttributedPayload[] = [];
    const frames: (number | undefined)[] = [];
    let index = -1;
    let childCount = 0;

    for (const log of logs) {
        const invoke = log.match(INVOKE);
        if (invoke) {
            if (frames.length === 0) {
                index = nextInstructionIndex(instructionProgramIds, index, invoke[1]);
                childCount = 0;
                frames.push(undefined);
            } else {
                frames.push(childCount++);
            }
        } else if (STATUS.test(log)) {
            frames.pop();
        } else if (frames.length > 0) {
            const payload = toPayload(log);
            if (payload) payloads.push({ ...payload, childIndex: frames.at(-1), index });
        }
    }

    return payloads;
}

function nextInstructionIndex(instructionProgramIds: string[], previous: number, programId: string): number {
    const next = instructionProgramIds.indexOf(programId, previous + 1);
    return next === -1 ? previous + 1 : next;
}

function toPayload(log: string): ProgramEventPayload | undefined {
    if (log.startsWith('Program data:')) return { data: log.slice('Program data: '.length).trim(), kind: 'data' };
    if (!log.startsWith('Program log:')) return undefined;
    const payload = log.slice('Program log: '.length).trim();
    return isLikelyBase64Event(payload) ? { data: payload, kind: 'log' } : undefined;
}

const ANCHOR_DISCRIMINATOR_BASE64_LENGTH = 12;

function isLikelyBase64Event(payload: string): boolean {
    return payload.length >= ANCHOR_DISCRIMINATOR_BASE64_LENGTH && payload.length % 4 === 0 && isValidBase64(payload);
}
