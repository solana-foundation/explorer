import type { Meta, StoryObj } from '@storybook/react';

import { TimestampToggle } from '../TimestampToggle';

const meta = {
    component: TimestampToggle,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/TimestampToggle',
} satisfies Meta<typeof TimestampToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

const unixTimestamp = 1717891200;

export const Default: Story = {
    args: { unixTimestamp },
};

export const Shorter: Story = {
    args: { shorter: true, unixTimestamp },
};
