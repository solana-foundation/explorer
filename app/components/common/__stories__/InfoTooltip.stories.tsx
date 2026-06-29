import type { Meta, StoryObj } from '@storybook-config/types';

import { InfoTooltip } from '../InfoTooltip';

const meta = {
    component: InfoTooltip,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InfoTooltip',
} satisfies Meta<typeof InfoTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: <span>Hover for more info</span>,
        text: 'This is the tooltip text shown on hover.',
    },
};

export const Bottom: Story = {
    args: {
        bottom: true,
        children: <span>Hover for more info</span>,
        text: 'Tooltip on bottom side.',
    },
};

export const RightAligned: Story = {
    args: {
        children: <span>Right-aligned trigger</span>,
        right: true,
        text: 'Tooltip on the right side, trigger justified end.',
    },
};

export const WithoutHelpIcon: Story = {
    args: {
        children: <span>No icon trigger</span>,
        text: 'Tooltip without the help icon.',
        withHelpIcon: false,
    },
};

export const NoTextRendersChildrenOnly: Story = {
    args: {
        children: <span>Children passthrough when text is missing</span>,
    },
};
