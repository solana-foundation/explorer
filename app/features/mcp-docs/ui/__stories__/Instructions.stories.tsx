import type { Meta, StoryObj } from '@storybook-config/types';

import { Instructions } from '../Instructions';
import { withMcpBand } from './mcp-band-decorator';

const meta: Meta<typeof Instructions> = {
    component: Instructions,
    decorators: [withMcpBand],
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/Instructions',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
