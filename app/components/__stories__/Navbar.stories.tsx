import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { Navbar } from '../Navbar';

const meta = {
    component: Navbar,
    decorators: [withCluster],
    parameters: {
        ...nextjsParameters,
        // Logo + navbar drawer need vertical room; pin the docs canvas so the full row is visible.
        docs: { story: { height: '80px' } },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Navbar',
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithChildren: Story = {
    args: {
        children: <div className="text-dk-gray-700">Page-level slot content (e.g., breadcrumbs)</div>,
    },
};
