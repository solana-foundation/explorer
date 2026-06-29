/* eslint-disable no-restricted-syntax -- test normalizes rendered hex whitespace via RegExp */
import type { Program } from '@coral-xyz/anchor';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ProgramEventsCard } from '../ProgramEventsCard';

const SAMPLE_DISCRIMINATOR = [1, 2, 3, 4, 5, 6, 7, 8];
// discriminator + amount: u64 LE (1_000_000_000) + counter: u32 LE (42)
const sampleEventBytes = Buffer.from([...SAMPLE_DISCRIMINATOR, 0x00, 0xca, 0x9a, 0x3b, 0, 0, 0, 0, 0x2a, 0, 0, 0]);
// A payload whose discriminator matches no IDL event — decodeEventFromLog drops it.
const undecodableBytes = Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0]);

const sampleProgram = {
    idl: {
        accounts: [],
        address: '11111111111111111111111111111111',
        events: [{ discriminator: SAMPLE_DISCRIMINATOR, name: 'sampleEvent' }],
        instructions: [],
        metadata: { name: 'sample_program', spec: '0.1.0', version: '0.1.0' },
        types: [
            {
                name: 'sampleEvent',
                type: {
                    fields: [
                        { name: 'amount', type: 'u64' },
                        { name: 'counter', type: 'u32' },
                    ],
                    kind: 'struct',
                },
            },
        ],
    },
} as unknown as Program;

describe('ProgramEventsCard', () => {
    it('should pair the raw view with the decoded event when an earlier payload is undecodable', async () => {
        // Undecodable payload first: the decoded list is filtered while raw payloads are not, so a naive
        // index would pair the surviving event with the skipped payload's bytes.
        render(
            <ProgramEventsCard
                eventDataList={[undecodableBytes.toString('base64'), sampleEventBytes.toString('base64')]}
                instructionIndex={0}
                program={sampleProgram}
            />,
        );

        expect(screen.getByText('Sample Event')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Raw' }));

        const hex = (document.body.textContent ?? '').replace(/\s/g, '').toLowerCase();
        expect(hex).toContain('0102030405060708'); // the decoded event's own discriminator
        expect(hex).not.toContain('0909090909090909'); // the skipped payload's bytes
    });

    it('should render nothing when no payload decodes', () => {
        const { container } = render(
            <ProgramEventsCard eventDataList={['aGVsbG8=']} instructionIndex={0} program={sampleProgram} />,
        );
        expect(container).toBeEmptyDOMElement();
    });
});
