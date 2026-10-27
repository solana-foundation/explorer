import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { AttestationDataCard } from '../sas/AttestationDataCard';
import * as Base from './AttestationDataCard.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: AttestationDataCard,
    decorators: [withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AttestationDataCard@Media',
} satisfies Meta<typeof AttestationDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const { args, decorators } = Base.AttestationWithSchema;

export const Mobile: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    decorators,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    decorators,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
