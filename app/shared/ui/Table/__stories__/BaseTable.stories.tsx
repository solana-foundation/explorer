import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseCard, BaseCardBody, BaseCardHeader, BaseCardTitle } from '../../Card';
import { BaseTable } from '../BaseTable';

const meta: Meta<typeof BaseTable> = {
    component: BaseTable,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Table/BaseTable',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleRows = () => (
    <>
        <BaseTable.Head>
            <BaseTable.Row>
                <BaseTable.HeaderCell>Label</BaseTable.HeaderCell>
                <BaseTable.HeaderCell>Value</BaseTable.HeaderCell>
            </BaseTable.Row>
        </BaseTable.Head>
        <BaseTable.Body>
            <BaseTable.Row>
                <BaseTable.Cell>Slot</BaseTable.Cell>
                <BaseTable.Cell>123,456</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Epoch</BaseTable.Cell>
                <BaseTable.Cell>789</BaseTable.Cell>
            </BaseTable.Row>
        </BaseTable.Body>
    </>
);

const CardSampleRows = () => (
    <>
        <BaseTable.Head>
            <BaseTable.Row>
                <BaseTable.HeaderCell>Address</BaseTable.HeaderCell>
                <BaseTable.HeaderCell>Balance</BaseTable.HeaderCell>
            </BaseTable.Row>
        </BaseTable.Head>
        <BaseTable.Body>
            <BaseTable.Row>
                <BaseTable.Cell>11111111111111111111111111111111</BaseTable.Cell>
                <BaseTable.Cell>4.2 SOL</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA</BaseTable.Cell>
                <BaseTable.Cell>0 SOL</BaseTable.Cell>
            </BaseTable.Row>
        </BaseTable.Body>
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
            <BaseCardBody ui="dashkit" className="p-0">
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
