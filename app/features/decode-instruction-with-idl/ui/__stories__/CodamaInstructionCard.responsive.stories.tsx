import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { CodamaInstructionCard } from '../CodamaInstructionCard';
import * as Base from './CodamaInstructionCard.stories';

const meta: Meta<typeof CodamaInstructionCard> = {
    component: CodamaInstructionCard,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    // TODO(decode-instruction-with-idl): rename to a feature-scoped title once the Storybook tree migration off
    // the Dashkit layout lands; kept stable here to avoid churning the tree mid-move.
    title: 'Components/Instruction/CodamaInstructionDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.UnknownFallback.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
