import type { Program } from '@coral-xyz/anchor';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ProgramEventsCard } from '../ProgramEventsCard';

// A minimal Program stub with an empty events list — decodeEventFromLog returns null for
// the raw bytes below, so the component renders nothing (its empty-state return).
const emptyProgram = {
    idl: {
        accounts: [],
        address: '11111111111111111111111111111111',
        events: [],
        instructions: [],
        metadata: { name: 'sample_program', spec: '0.1.0', version: '0.1.0' },
        types: [],
    },
} as unknown as Program;

// Anchor-style 8-byte event discriminator. Borsh struct payload follows: u64 amount + u32 counter.
const SAMPLE_DISCRIMINATOR = [1, 2, 3, 4, 5, 6, 7, 8];
const sampleEventBytes = Buffer.from([
    ...SAMPLE_DISCRIMINATOR,
    // amount: u64 LE = 1_000_000_000
    0x00,
    0xca,
    0x9a,
    0x3b,
    0x00,
    0x00,
    0x00,
    0x00,
    // counter: u32 LE = 42
    0x2a,
    0x00,
    0x00,
    0x00,
]);

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

const meta = {
    component: ProgramEventsCard,
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramEventsCard',
} satisfies Meta<typeof ProgramEventsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoDecodedEvents: Story = {
    args: {
        eventDataList: ['aGVsbG8='],
        instructionIndex: 0,
        program: emptyProgram,
    },
};

export const WithDecodedEvent: Story = {
    args: {
        eventDataList: [sampleEventBytes.toString('base64')],
        instructionIndex: 0,
        program: sampleProgram,
    },
};

export const WithMultipleEvents: Story = {
    args: {
        eventDataList: [sampleEventBytes.toString('base64'), sampleEventBytes.toString('base64')],
        instructionIndex: 2,
        program: sampleProgram,
    },
};
