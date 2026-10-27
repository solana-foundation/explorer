import { Program } from '@coral-xyz/anchor';
import type { ProgramEventPayload } from '@entities/program-logs';
import { decodeEventFromLog } from '@utils/anchor';

import { Logger } from '@/app/shared/lib/logger';

export type DecodedEvent = { name: string; data: object };
export type EventEntry = { event: DecodedEvent | undefined; rawEventData: string };

export function decodeProgramEvents(eventPayloads: ProgramEventPayload[], program: Program): EventEntry[] {
    return eventPayloads.flatMap(({ data, kind }): EventEntry[] => {
        let event: DecodedEvent | undefined;
        try {
            event = decodeEventFromLog(data, program) ?? undefined;
        } catch (error) {
            Logger.error(error);
        }
        if (event) return [{ event, rawEventData: data }];
        return kind === 'data' ? [{ event: undefined, rawEventData: data }] : [];
    });
}
