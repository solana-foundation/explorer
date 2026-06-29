import type { Program } from '@coral-xyz/anchor';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ProgramEventsCard } from '../ProgramEventsCard';

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

const meta: Meta<typeof ProgramEventsCard> = {
    component: ProgramEventsCard,
    decorators: [withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramEventsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    eventPayloads: [{ data: sampleEventBytes.toString('base64'), kind: 'data' as const }],
    instructionIndex: 0,
    program: sampleProgram,
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
