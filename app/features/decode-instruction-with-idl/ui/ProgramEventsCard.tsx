import { HexData } from '@components/common/HexData';
import { Program } from '@coral-xyz/anchor';
import { IdlField, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { ArgRows } from '@entities/instruction-card';
import { anchorInstructionArgs } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';
import React, { useState } from 'react';
import { Code } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { fromBase64 } from '@/app/shared/lib/bytes';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import type { DecodedEvent, EventEntry } from '../lib/decode-program-events';

export function ProgramEventsCard({
    entries,
    program,
    instructionIndex,
    childIndex,
}: {
    entries: EventEntry[];
    program: Program;
    instructionIndex: number;
    childIndex?: number;
}) {
    return (
        <>
            {entries.map(({ event, rawEventData }, eventIndex) => (
                <EventCard
                    key={eventIndex}
                    event={event}
                    eventIndex={eventIndex}
                    instructionIndex={instructionIndex}
                    childIndex={childIndex}
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
    childIndex,
    program,
    rawEventData,
}: {
    event: DecodedEvent | undefined;
    eventIndex: number;
    instructionIndex: number;
    childIndex: number | undefined;
    program: Program;
    rawEventData: string;
}) {
    const [showRaw, setShowRaw] = useState(false);
    const eventDef = event ? program.idl.events?.find(e => e.name === event.name) : undefined;
    const eventFields = event ? program.idl.types?.find(type => type.name === event.name) : undefined;
    const fields = ((eventFields?.type as IdlTypeDefTyStruct)?.fields as IdlField[]) ?? [];

    // An unknown event has no decoded view — show its raw bytes only.
    const showHex = !event || showRaw;

    return (
        <Card ui="dashkit" className="mb-1.5">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    <Badge ui="dashkit" variant="info" className="mr-1.5">
                        #{instructionIndex + 1}
                        {childIndex !== undefined ? `.${childIndex + 1}` : ''} · event {eventIndex + 1}
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
                        eventDef &&
                        fields.length > 0 && (
                            <>
                                <BaseTable.SectionRow>
                                    <BaseTable.Cell>Field Name</BaseTable.Cell>
                                    <BaseTable.Cell>Type</BaseTable.Cell>
                                    <BaseTable.Cell className="text-right">Value</BaseTable.Cell>
                                </BaseTable.SectionRow>
                                <ArgRows
                                    args={anchorInstructionArgs(
                                        event.data,
                                        { args: fields, name: eventDef.name },
                                        program.idl,
                                    )}
                                />
                            </>
                        )
                    )}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
