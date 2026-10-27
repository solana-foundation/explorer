import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { PageLayout } from '../PageLayout';
import * as Base from './PageLayout.stories';

// The page shell and its block rhythm switch at `lg` (992px): mobile tiers below, desktop at and
// above. These variants pin a viewport so the per-tier padding and between-blocks spacing are
// visible without resizing the window by hand.
const meta = {
    component: PageLayout,
    decorators: [withViewportFromGlobal],
    globals: { backgrounds: { value: 'dark' } },
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Design System/Page Layout@Media',
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const { render } = Base.Default;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};
