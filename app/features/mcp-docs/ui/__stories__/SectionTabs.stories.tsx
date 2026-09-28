import type { Meta, StoryObj } from '@storybook-config/types';

import { SectionTabs } from '../SectionTabs';

const meta: Meta<typeof SectionTabs> = {
    component: SectionTabs,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/SectionTabs',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
