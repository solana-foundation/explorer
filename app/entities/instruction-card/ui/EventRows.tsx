import { Badge } from '@components/shared/ui/badge';
import { CollapsibleCard } from '@components/shared/ui/collapsible-card';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import type { InstructionEvent } from '../model/events';
import { type InstructionPosition, positionLabel } from '../model/node';
import { ArgTable } from './ArgRows';
import { HexDataRow } from './BaseRawDetails';
import { DECODED_TABLE_COLUMNS } from './DecodedInstructionCard';
import { CardTable } from './InstructionCardFrame';

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
            <BaseTable.Row>
                <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                    {events.map((event, eventIndex) => (
                        // Events never reorder, so the card key is the position.
                        <CollapsibleCard
                            key={eventIndex}
                            collapsible={false}
                            title={
                                <>
                                    <Badge ui="dashkit" variant="info" className="mr-1.5 flex-none">
                                        {`#${positionLabel(position)} · event ${eventIndex + 1}`}
                                    </Badge>
                                    {event.kind === 'decoded' ? event.name : 'Unknown Event'}
                                </>
                            }
                        >
                            <CardTable>
                                {event.kind === 'decoded' && !showRaw ? (
                                    <ArgTable label="Field Name" args={event.args} />
                                ) : (
                                    <HexDataRow label="Event Data" data={event.data} />
                                )}
                            </CardTable>
                        </CollapsibleCard>
                    ))}
                </BaseTable.Cell>
            </BaseTable.Row>
        </>
    );
}
