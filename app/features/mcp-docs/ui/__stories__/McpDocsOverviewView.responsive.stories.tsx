import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { McpDocsOverviewView } from '../McpDocsOverviewView';
import * as Base from './McpDocsOverviewView.stories';

const meta: Meta<typeof McpDocsOverviewView> = {
    component: McpDocsOverviewView,
    decorators: [withViewportFromGlobal],
    parameters: Base.default.parameters,
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Overview@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const render = () => <McpDocsOverviewView />;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};
