import type { Program } from '@coral-xyz/anchor';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';

import { ProgramEventsCard } from '../ProgramEventsCard';

// A minimal Program stub with an empty events list — decodeEventFromLog returns null for
// the raw bytes below, so the component renders nothing (its empty-state return). The
// populated visual requires a real Anchor Program instance with a matching event coder,
// which is heavy fixture work; the formatted-idl/* stories already exercise the IDL render
// paths used downstream of this card.
const mockProgram = {
    idl: {
        accounts: [],
        address: '11111111111111111111111111111111',
        events: [],
        instructions: [],
        metadata: { name: 'sample_program', spec: '0.1.0', version: '0.1.0' },
        types: [],
    },
} as unknown as Program;

const meta = {
    component: ProgramEventsCard,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Instruction/ProgramEventsCard',
} satisfies Meta<typeof ProgramEventsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoDecodedEvents: Story = {
    args: {
        eventDataList: ['aGVsbG8='],
        instructionIndex: 0,
        program: mockProgram,
    },
};
