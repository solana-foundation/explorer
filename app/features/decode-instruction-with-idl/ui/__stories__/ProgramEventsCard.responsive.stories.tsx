import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ProgramEventsCard } from '../ProgramEventsCard';
import * as Base from './ProgramEventsCard.stories';

const meta: Meta<typeof ProgramEventsCard> = {
    component: ProgramEventsCard,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramEventsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithDecodedEvent.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
