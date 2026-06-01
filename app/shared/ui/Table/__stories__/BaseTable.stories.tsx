import type { Meta, StoryObj } from '@storybook/react';

import { BaseTable } from '../BaseTable';

const meta: Meta<typeof BaseTable> = {
    component: BaseTable,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Table/BaseTable',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleRows = () => (
    <>
        <thead>
            <tr>
                <th>Label</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Slot</td>
                <td>123,456</td>
            </tr>
            <tr>
                <td>Epoch</td>
                <td>789</td>
            </tr>
        </tbody>
    </>
);

export const Dashkit: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseTable {...args}>
            <SampleRows />
        </BaseTable>
    ),
};

export const DashkitNowrap: Story = {
    args: { nowrap: true, ui: 'dashkit' },
    render: args => (
        <BaseTable {...args}>
            <SampleRows />
        </BaseTable>
    ),
};

export const Tw: Story = {
    args: { ui: 'tw' },
    render: args => (
        <BaseTable {...args}>
            <SampleRows />
        </BaseTable>
    ),
};

export const TwNowrap: Story = {
    args: { nowrap: true, ui: 'tw' },
    render: args => (
        <BaseTable {...args}>
            <SampleRows />
        </BaseTable>
    ),
};
