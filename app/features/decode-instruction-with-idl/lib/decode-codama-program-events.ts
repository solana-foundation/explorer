import { codamaScalarTypeLabels, type InstructionEvent, parseCodamaArgs } from '@entities/instruction-card';
import type { ProgramEventPayload } from '@entities/program-logs';
import { decodeEventWithIdl } from '@explorer/idl-decode/codama';
import { camelToTitleCase } from '@utils/index';
import { getLastNodeFromPath, type RootNode } from 'codama';

import { fromBase64 } from '@/app/shared/lib/bytes';

// The codama counterpart to decode-program-events: nodes-from-anchor (>= 1.5) carries Anchor events into
// the root, so the codama engine decodes them — no built anchor Program / BorshEventCoder, which legacy
// (pre-0.30) programs cannot produce.
export function decodeCodamaProgramEvents(eventPayloads: ProgramEventPayload[], root: RootNode): InstructionEvent[] {
    return eventPayloads.flatMap(({ data, kind }): InstructionEvent[] => {
        const bytes = fromBase64(data);
        const decoded = decodeEventWithIdl(root, bytes);
        if (decoded.kind !== 'unknown') {
            const node = getLastNodeFromPath(decoded.decoded.path);
            const name = node.kind === 'eventNode' ? node.name : 'event';
            return [
                {
                    args: parseCodamaArgs(decoded.decoded.data, codamaScalarTypeLabels(decoded)),
                    data: bytes,
                    kind: 'decoded',
                    name: camelToTitleCase(name),
                },
            ];
        }
        // only `Program data:` lines are events by construction — a `Program log:` miss is just a log line
        return kind === 'data' ? [{ data: bytes, kind: 'unknown' }] : [];
    });
}
