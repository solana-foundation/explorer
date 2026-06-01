import type { Meta, StoryObj } from '@storybook/react';

import { BaseCard, BaseCardBody, BaseCardHeader, BaseCardTitle } from '../../Card';
import { BaseCardTable } from '../BaseCardTable';

const meta: Meta<typeof BaseCardTable> = {
    component: BaseCardTable,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Table/BaseCardTable',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleRows = () => (
    <>
        <thead>
            <tr>
                <th>Address</th>
                <th>Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>11111111111111111111111111111111</td>
                <td>4.2 SOL</td>
            </tr>
            <tr>
                <td>TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA</td>
                <td>0 SOL</td>
            </tr>
        </tbody>
    </>
);

export const Dashkit: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCardTable {...args}>
            <SampleRows />
        </BaseCardTable>
    ),
};

export const DashkitNowrap: Story = {
    args: { nowrap: true, ui: 'dashkit' },
    render: args => (
        <BaseCardTable {...args}>
            <SampleRows />
        </BaseCardTable>
    ),
};

export const DashkitInsideCard: Story = {
    args: { nowrap: true, ui: 'dashkit' },
    render: args => (
        <BaseCard ui="dashkit">
            <BaseCardHeader>
                <BaseCardTitle>Top Accounts</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody className="e-p-0">
                <BaseCardTable {...args}>
                    <SampleRows />
                </BaseCardTable>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const Tw: Story = {
    args: { ui: 'tw' },
    render: args => (
        <BaseCardTable {...args}>
            <SampleRows />
        </BaseCardTable>
    ),
};

export const TwNowrap: Story = {
    args: { nowrap: true, ui: 'tw' },
    render: args => (
        <BaseCardTable {...args}>
            <SampleRows />
        </BaseCardTable>
    ),
};
