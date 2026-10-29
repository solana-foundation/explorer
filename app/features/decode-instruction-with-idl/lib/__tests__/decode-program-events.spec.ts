import type { Program } from '@coral-xyz/anchor';
import { describe, expect, it } from 'vitest';

import { decodeProgramEvents } from '../decode-program-events';

const SAMPLE_DISCRIMINATOR = [1, 2, 3, 4, 5, 6, 7, 8];
// discriminator + amount: u64 LE (1_000_000_000) + counter: u32 LE (42)
const sampleEventBytes = Buffer.from([...SAMPLE_DISCRIMINATOR, 0x00, 0xca, 0x9a, 0x3b, 0, 0, 0, 0, 0x2a, 0, 0, 0]);
// A payload whose discriminator matches no IDL event, so decodeEventFromLog returns null.
const undecodableBytes = Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0]);
const sample = { data: sampleEventBytes.toString('base64'), kind: 'data' as const };
const undecodableData = { data: undecodableBytes.toString('base64'), kind: 'data' as const };
const undecodableLog = { data: undecodableBytes.toString('base64'), kind: 'log' as const };

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

describe('decodeProgramEvents', () => {
    it('should decode an event to its name, its fields and its bytes', () => {
        const [event] = decodeProgramEvents([sample], sampleProgram);

        expect(event).toEqual({
            args: [
                { kind: 'leaf', name: 'Amount', type: 'u64', value: { kind: 'text', value: '1,000,000,000' } },
                { kind: 'leaf', name: 'Counter', type: 'u32', value: { kind: 'text', value: '42' } },
            ],
            data: new Uint8Array(sampleEventBytes),
            kind: 'decoded',
            name: 'Sample Event',
        });
    });

    it('should keep the bytes of a Program data payload that does not decode', () => {
        expect(decodeProgramEvents([undecodableData], sampleProgram)).toEqual([
            { data: new Uint8Array(undecodableBytes), kind: 'unknown' },
        ]);
    });

    it('should drop a Program log payload that does not decode', () => {
        expect(decodeProgramEvents([undecodableLog], sampleProgram)).toEqual([]);
    });

    // A dropped payload must not shift the bytes that the next event shows in the Raw view.
    it('should pair each event with its own bytes when a dropped payload precedes it', () => {
        const events = decodeProgramEvents([undecodableLog, sample], sampleProgram);

        expect(events.map(event => event.data)).toEqual([new Uint8Array(sampleEventBytes)]);
    });
});
