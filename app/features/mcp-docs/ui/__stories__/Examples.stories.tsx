import type { Meta, StoryObj } from '@storybook-config/types';

import { Examples } from '../Examples';
import { withMcpBand } from './mcp-band-decorator';

const meta: Meta<typeof Examples> = {
    component: Examples,
    decorators: [withMcpBand],
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Examples',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
