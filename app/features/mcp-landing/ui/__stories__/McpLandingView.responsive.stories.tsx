import { withMcpHealthy } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { McpLandingView } from '../McpLandingView';

const meta: Meta<typeof McpLandingView> = {
    component: McpLandingView,
    decorators: [withViewportFromGlobal, withMcpHealthy],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/McpLanding/McpLandingView@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

// The tab strip wraps and the setup snippets must stay readable at the narrow end.
export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
};
