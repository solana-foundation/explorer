import { Badge } from '@components/shared/ui/badge';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import type { InstructionEvent } from '../model/events';
import { type InstructionPosition, positionLabel } from '../model/node';
import { ArgTable } from './ArgRows';
import { HexDataRow } from './BaseRawDetails';
import { DECODED_TABLE_COLUMNS } from './DecodedInstructionCard';

export function EventRows({
    events,
    position,
    showRaw,
}: {
    events: readonly InstructionEvent[];
    position: InstructionPosition;
    showRaw: boolean;
}) {
    return (
        <>
            <BaseTable.SectionRow>
                <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>Events</BaseTable.Cell>
            </BaseTable.SectionRow>
            {events.map((event, eventIndex) => (
                // Events never reorder, so the row key is the position.
                <React.Fragment key={eventIndex}>
                    <BaseTable.Row>
                        <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                            <Badge ui="dashkit" variant="info" className="mr-1.5">
                                {`#${positionLabel(position)} · event ${eventIndex + 1}`}
                            </Badge>
                            {event.kind === 'decoded' ? event.name : 'Unknown Event'}
                        </BaseTable.Cell>
                    </BaseTable.Row>
                    {event.kind === 'decoded' && !showRaw ? (
                        <ArgTable label="Field Name" args={event.args} />
                    ) : (
                        <HexDataRow label="Event Data" data={event.data} />
                    )}
                </React.Fragment>
            ))}
        </>
    );
}
