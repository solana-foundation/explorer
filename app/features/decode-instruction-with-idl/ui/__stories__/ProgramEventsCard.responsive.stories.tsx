import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { sampleEvent, sampleProgram } from '../../__fixtures__/anchor-programs';
import { decodeProgramEvents } from '../../lib/decode-program-events';
import { ProgramEventsCard } from '../ProgramEventsCard';

const meta: Meta<typeof ProgramEventsCard> = {
    component: ProgramEventsCard,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramEventsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    entries: decodeProgramEvents([sampleEvent], sampleProgram),
    instructionIndex: 0,
    program: sampleProgram,
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
