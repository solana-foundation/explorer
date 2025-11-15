import { HexData } from '@components/common/HexData';
import { Program } from '@coral-xyz/anchor';
import { IdlField, IdlTypeDefTyStruct } from '@coral-xyz/anchor/dist/cjs/idl';
import { decodeEventFromLog, mapIxArgsToRows } from '@utils/anchor';
import { camelToTitleCase } from '@utils/index';
import { Buffer } from 'buffer';
import React, { useState } from 'react';
import { Code } from 'react-feather';

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
                console.error('Error decoding event:', error);
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
        <div className="card mb-2">
            <div className="card-header">
                <h3 className="card-header-title mb-0 d-flex align-items-center">
                    <span className="badge bg-info-soft me-2">
                        #{instructionIndex + 1}.{eventIndex + 1}
                    </span>
                    {camelToTitleCase(event.name)}
                </h3>
                <button
                    className={`btn btn-sm d-flex align-items-center ${showRaw ? 'btn-black active' : 'btn-white'}`}
                    onClick={() => setShowRaw(r => !r)}
                >
                    <Code className="me-2" size={13} /> Raw
                </button>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <tbody className="list">
                        {showRaw ? (
                            <>
                                <tr>
                                    <td>
                                        Event Data <span className="text-muted">(Hex)</span>
                                    </td>
                                    <td className="text-lg-end">
                                        <HexData raw={Buffer.from(rawEventData, 'base64')} />
                                    </td>
                                </tr>
                            </>
                        ) : (
                            <>
                                {fields.length > 0 && (
                                    <>
                                        <tr className="table-sep">
                                            <td>Field Name</td>
                                            <td>Type</td>
                                            <td className="text-lg-end">Value</td>
                                        </tr>
                                        {mapIxArgsToRows(event.data, { ...eventDef, args: fields } as any, program.idl)}
                                    </>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
