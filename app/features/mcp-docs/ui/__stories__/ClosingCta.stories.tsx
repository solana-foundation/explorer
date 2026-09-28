import type { Meta, StoryObj } from '@storybook-config/types';

import { ClosingCta } from '../ClosingCta';

const meta: Meta<typeof ClosingCta> = {
    component: ClosingCta,
    parameters: { layout: 'fullscreen' },
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/ClosingCta',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
