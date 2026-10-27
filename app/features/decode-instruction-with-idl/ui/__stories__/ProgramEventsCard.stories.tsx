import type { Meta, StoryObj } from '@storybook-config/types';

import { sampleEvent, sampleProgram } from '../../__fixtures__/anchor-programs';
import { decodeProgramEvents } from '../../lib/decode-program-events';
import { ProgramEventsCard } from '../ProgramEventsCard';

const meta = {
    component: ProgramEventsCard,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramEventsCard',
} satisfies Meta<typeof ProgramEventsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDecodedEvent: Story = {
    args: {
        entries: decodeProgramEvents([sampleEvent], sampleProgram),
        instructionIndex: 0,
        program: sampleProgram,
    },
};

export const WithMultipleEvents: Story = {
    args: {
        entries: decodeProgramEvents([sampleEvent, sampleEvent], sampleProgram),
        instructionIndex: 2,
        program: sampleProgram,
    },
};

export const UnknownEvent: Story = {
    args: {
        entries: decodeProgramEvents(
            [{ data: Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0]).toString('base64'), kind: 'data' }],
            sampleProgram,
        ),
        instructionIndex: 0,
        program: sampleProgram,
    },
};
