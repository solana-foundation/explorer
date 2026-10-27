/* eslint-disable no-restricted-syntax -- test normalizes rendered hex whitespace via RegExp */
import type { ProgramEventPayload } from '@entities/program-logs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { sampleEvent, sampleProgram } from '../../__fixtures__/anchor-programs';
import { decodeProgramEvents } from '../../lib/decode-program-events';
import { ProgramEventsCard } from '../ProgramEventsCard';

// A payload whose discriminator matches no IDL event — decodeEventFromLog returns null.
const undecodableBytes = Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0]);
const undecodableData = { data: undecodableBytes.toString('base64'), kind: 'data' as const };
const undecodableLog = { data: undecodableBytes.toString('base64'), kind: 'log' as const };

describe('ProgramEventsCard', () => {
    it('should render the decoded event', () => {
        renderEvents([sampleEvent]);
        expect(screen.getByText('Sample Event')).toBeInTheDocument();
        expect(screen.getByText('1,000,000,000')).toBeInTheDocument();
    });

    it('should render an undecodable Program data payload as an Unknown Event with raw bytes', () => {
        renderEvents([undecodableData]);
        expect(screen.getByText('Unknown Event')).toBeInTheDocument();
        const hex = (document.body.textContent ?? '').replace(/\s/g, '').toLowerCase();
        expect(hex).toContain('0909090909090909');
    });

    it('should keep the raw view aligned when a dropped payload precedes a decoded one', async () => {
        // The dropped `log` payload must not shift the surviving event's paired raw bytes.
        renderEvents([undecodableLog, sampleEvent]);

        expect(screen.getByText('Sample Event')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        const hex = (document.body.textContent ?? '').replace(/\s/g, '').toLowerCase();
        expect(hex).toContain('0102030405060708'); // the decoded event's own discriminator
        expect(hex).not.toContain('0909090909090909'); // the dropped payload's bytes
    });
});

describe('decodeProgramEvents', () => {
    it('should drop an undecodable Program log payload', () => {
        expect(decodeProgramEvents([undecodableLog], sampleProgram)).toEqual([]);
    });
});

function renderEvents(eventPayloads: ProgramEventPayload[]) {
    return render(
        <ProgramEventsCard
            entries={decodeProgramEvents(eventPayloads, sampleProgram)}
            instructionIndex={0}
            program={sampleProgram}
        />,
    );
}
