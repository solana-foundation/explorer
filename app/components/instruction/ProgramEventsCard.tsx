import { HexData } from '@components/common/HexData';
import { Program } from '@coral-xyz/anchor';
import { IdlField, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { decodeEventFromLog, mapIxArgsToRows } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';
import React, { useState } from 'react';
import { Code } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { fromBase64 } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function ProgramEventsCard({
    eventDataList,
    program,
    instructionIndex,
}: {
    eventDataList: string[];
    program: Program;
    instructionIndex: number;
}) {
    const decodedEvents = eventDataList
        .map(eventData => {
            try {
                return decodeEventFromLog(eventData, program);
            } catch (error) {
                Logger.error(error);
                return null;
            }
        })
        .filter((event): event is { name: string; data: any } => event !== null);

    if (decodedEvents.length === 0) {
        return null;
    }

    return (
        <>
            {decodedEvents.map((event, eventIndex) => (
                <EventCard
                    key={eventIndex}
                    event={event}
                    eventIndex={eventIndex}
                    instructionIndex={instructionIndex}
                    program={program}
                    rawEventData={eventDataList[eventIndex]}
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
    event: { name: string; data: any };
    eventIndex: number;
    instructionIndex: number;
    program: Program;
    rawEventData: string;
}) {
    const [showRaw, setShowRaw] = useState(false);
    const eventDef = program.idl.events?.find(e => e.name === event.name);

    // Event fields are stored in the types section, not on the event itself
    const eventFields = program.idl.types?.find((type: any) => type.name === event.name);
    const fields = ((eventFields?.type as IdlTypeDefTyStruct)?.fields as IdlField[]) ?? [];

    return (
        <Card ui="dashkit" className="e-mb-1.5">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="e-flex e-items-center">
                    <Badge ui="dashkit" variant="info" className="e-mr-1.5">
                        #{instructionIndex + 1}.{eventIndex + 1}
                    </Badge>
                    {camelToTitleCase(event.name)}
                </CardTitle>
                <Button
                    ui="dashkit"
                    size="sm"
                    variant={showRaw ? 'black' : 'white'}
                    active={showRaw}
                    className="e-flex e-items-center"
                    onClick={() => setShowRaw(r => !r)}
                >
                    <Code className="e-mr-1.5" size={13} /> Raw
                </Button>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Body className="list">
                    {showRaw ? (
                        <>
                            <BaseTable.Row>
                                <BaseTable.Cell>
                                    Event Data <span className="text-muted">(Hex)</span>
                                </BaseTable.Cell>
                                <BaseTable.Cell className="e-text-right">
                                    <HexData raw={fromBase64(rawEventData)} />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        </>
                    ) : (
                        <>
                            {fields.length > 0 && (
                                <>
                                    <BaseTable.Row className="table-sep">
                                        <BaseTable.Cell>Field Name</BaseTable.Cell>
                                        <BaseTable.Cell>Type</BaseTable.Cell>
                                        <BaseTable.Cell className="e-text-right">Value</BaseTable.Cell>
                                    </BaseTable.Row>
                                    {mapIxArgsToRows(event.data, { ...eventDef, args: fields } as any, program.idl)}
                                </>
                            )}
                        </>
                    )}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
