import type { Meta, StoryObj } from '@storybook/react';

import { BaseCard, BaseCardBody, BaseCardHeader, BaseCardTitle } from '../../Card';
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

const CardSampleRows = () => (
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

// `variant="card"` wraps the table in a `table-responsive` div and adds the dashkit `.card-table`
// styling (zero thead border-top, first/last cell padding aligned with card edges).
export const DashkitCard: Story = {
    args: { ui: 'dashkit', variant: 'card' },
    name: 'Dashkit / Card variant',
    render: args => (
        <BaseTable {...args}>
            <CardSampleRows />
        </BaseTable>
    ),
};

export const DashkitCardNowrap: Story = {
    args: { nowrap: true, ui: 'dashkit', variant: 'card' },
    name: 'Dashkit / Card variant + nowrap',
    render: args => (
        <BaseTable {...args}>
            <CardSampleRows />
        </BaseTable>
    ),
};

export const DashkitCardInsideCard: Story = {
    args: { nowrap: true, ui: 'dashkit', variant: 'card' },
    name: 'Dashkit / Card variant inside <BaseCard>',
    render: args => (
        <BaseCard ui="dashkit">
            <BaseCardHeader ui="dashkit">
                <BaseCardTitle ui="dashkit">Top Accounts</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody ui="dashkit" className="e-p-0">
                <BaseTable {...args}>
                    <CardSampleRows />
                </BaseTable>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const TwCard: Story = {
    args: { ui: 'tw', variant: 'card' },
    name: 'Tw / Card variant',
    render: args => (
        <BaseTable {...args}>
            <CardSampleRows />
        </BaseTable>
    ),
};

export const TwCardNowrap: Story = {
    args: { nowrap: true, ui: 'tw', variant: 'card' },
    name: 'Tw / Card variant + nowrap',
    render: args => (
        <BaseTable {...args}>
            <CardSampleRows />
        </BaseTable>
    ),
};
