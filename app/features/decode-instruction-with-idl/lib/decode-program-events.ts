import { Program } from '@coral-xyz/anchor';
import { IdlField, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import type { InstructionArg, InstructionEvent } from '@entities/instruction-card';
import type { ProgramEventPayload } from '@entities/program-logs';
import { anchorInstructionArgs, decodeEventFromLog } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';

import { fromBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

type DecodedEvent = { name: string; data: object };

export function decodeProgramEvents(eventPayloads: ProgramEventPayload[], program: Program): InstructionEvent[] {
    return eventPayloads.flatMap(({ data, kind }): InstructionEvent[] => {
        let event: DecodedEvent | undefined;
        try {
            event = decodeEventFromLog(data, program) ?? undefined;
        } catch (error) {
            Logger.error(error);
        }
        if (event) {
            const args = eventArgs(event, program);
            return [{ args, data: fromBase64(data), kind: 'decoded', name: camelToTitleCase(event.name) }];
        }
        return kind === 'data' ? [{ data: fromBase64(data), kind: 'unknown' }] : [];
    });
}

function eventArgs(event: DecodedEvent, program: Program): InstructionArg[] {
    const eventDef = program.idl.events?.find(e => e.name === event.name);
    const eventType = program.idl.types?.find(type => type.name === event.name);
    const fields = ((eventType?.type as IdlTypeDefTyStruct | undefined)?.fields as IdlField[] | undefined) ?? [];
    return eventDef ? anchorInstructionArgs(event.data, { args: fields, name: eventDef.name }, program.idl) : [];
}
