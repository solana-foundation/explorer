import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ProgramMultisigCard } from '../ProgramMultisigCard';
import * as Base from './ProgramMultisigCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: ProgramMultisigCard,
    decorators: [withViewportFromGlobal, ...Base.default.decorators],
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/ProgramMultisigCard@Media',
} satisfies Meta<typeof ProgramMultisigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.Default.args;

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
