import { HexData } from '@components/common/HexData';
import { Program } from '@coral-xyz/anchor';
import { IdlField, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { decodeEventFromLog, mapIxArgsToRows } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';
import type { ProgramEventPayload } from '@utils/program-logs';
import React, { useState } from 'react';
import { Code } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { fromBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

type DecodedEvent = { name: string; data: any };
type EventEntry = { event: DecodedEvent | null; rawEventData: string };

export function ProgramEventsCard({
    eventPayloads,
    program,
    instructionIndex,
}: {
    eventPayloads: ProgramEventPayload[];
    program: Program;
    instructionIndex: number;
}) {
    // Decode each payload, keeping its raw bytes paired so the Raw view stays aligned. An undecodable
    // `Program data:` payload still renders as an "Unknown Event" (raw bytes), mirroring how unknown
    // instructions render; an undecodable base64-guessed `Program log:` payload is dropped (likely not
    // an event of this program).
    const entries = eventPayloads
        .map(({ data, kind }): EventEntry | null => {
            let event: DecodedEvent | null = null;
            try {
                event = decodeEventFromLog(data, program);
            } catch (error) {
                Logger.error(error);
            }
            if (event) return { event, rawEventData: data };
            return kind === 'data' ? { event: null, rawEventData: data } : null;
        })
        .filter((entry): entry is EventEntry => entry !== null);

    if (entries.length === 0) {
        return null;
    }

    return (
        <>
            {entries.map(({ event, rawEventData }, eventIndex) => (
                <EventCard
                    key={eventIndex}
                    event={event}
                    eventIndex={eventIndex}
                    instructionIndex={instructionIndex}
                    program={program}
                    rawEventData={rawEventData}
                />
            ))}
        </>
    );
}

function EventCard({
    event,
    eventIndex,
    instructionIndex,
    program,
    rawEventData,
}: {
    event: DecodedEvent | null;
    eventIndex: number;
    instructionIndex: number;
    program: Program;
    rawEventData: string;
}) {
    const [showRaw, setShowRaw] = useState(false);
    const eventDef = event ? program.idl.events?.find(e => e.name === event.name) : undefined;
    // Event fields are stored in the types section, not on the event itself
    const eventFields = event ? program.idl.types?.find((type: any) => type.name === event.name) : undefined;
    const fields = ((eventFields?.type as IdlTypeDefTyStruct)?.fields as IdlField[]) ?? [];

    // An unknown event has no decoded view — show its raw bytes only.
    const showHex = !event || showRaw;

    return (
        <Card ui="dashkit" className="mb-1.5">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    <Badge ui="dashkit" variant="info" className="mr-1.5">
                        #{instructionIndex + 1}.{eventIndex + 1}
                    </Badge>
                    {event ? camelToTitleCase(event.name) : 'Unknown Event'}
                </CardTitle>
                {event && (
                    <Button
                        ui="dashkit"
                        size="sm"
                        variant={showRaw ? 'black' : 'white'}
                        active={showRaw}
                        className="flex items-center"
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code className="mr-1.5" size={13} /> Raw
                    </Button>
                )}
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body>
                    {showHex ? (
                        <BaseTable.Row>
                            <BaseTable.Cell>
                                Event Data <span className="text-dk-gray-700">(Hex)</span>
                            </BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <HexData raw={fromBase64(rawEventData)} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    ) : (
                        event &&
                        fields.length > 0 && (
                            <>
                                <BaseTable.Row className="bg-dark-background text-dk-xs font-semibold uppercase tracking-[0.08em] text-dark-muted-foreground">
                                    <BaseTable.Cell>Field Name</BaseTable.Cell>
                                    <BaseTable.Cell>Type</BaseTable.Cell>
                                    <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                                </BaseTable.Row>
                                {mapIxArgsToRows(event.data, { ...eventDef, args: fields } as any, program.idl)}
                            </>
                        )
                    )}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
