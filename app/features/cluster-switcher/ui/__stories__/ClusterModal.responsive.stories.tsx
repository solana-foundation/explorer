import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { ClusterModal } from '../ClusterModal';
import * as Base from './ClusterModal.stories';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta = {
    component: ClusterModal,
    decorators: [...Base.default.decorators, withViewportFromGlobal],
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Features/ClusterSwitcher/ClusterModal@Media',
} satisfies Meta<typeof ClusterModal>;

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

// The tallest the panel gets, on the shortest viewport: the case the scrolling body exists for, since
// the developer settings at the bottom stay reachable only because the body scrolls.
export const MobileCustomCluster: Story = {
    decorators: Base.CustomCluster.decorators,
    globals: { viewport: { value: 'iphonex' } },
    parameters: Base.CustomCluster.parameters,
    render: Base.CustomCluster.render,
};
