import type { Meta, StoryObj } from '@storybook/react';

import { BaseTable } from '@/app/shared/ui/Table';

import {
    BaseCard,
    BaseCardBody,
    BaseCardDescription,
    BaseCardFooter,
    BaseCardHeader,
    BaseCardTitle,
} from '../BaseCard';

const meta: Meta<typeof BaseCard> = {
    component: BaseCard,
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Card/BaseCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DashkitDefault: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardBody>
                <p className="e-m-0">Plain dashkit card with a single body.</p>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const DashkitHeaderBodyFooter: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardHeader>
                <BaseCardTitle>Account overview</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody>
                <p className="e-m-0">Body content sits between the header and the footer.</p>
            </BaseCardBody>
            <BaseCardFooter>
                <span className="e-text-dk-sm e-text-dk-gray-600">Updated just now</span>
            </BaseCardFooter>
        </BaseCard>
    ),
};

export const DashkitFlexGrow: Story = {
    args: { flex: 'grow', ui: 'dashkit' },
    render: args => (
        <div className="e-flex e-h-[260px] e-gap-4">
            <BaseCard {...args}>
                <BaseCardBody>
                    <p className="e-m-0">Left — flex: grow fills the row.</p>
                </BaseCardBody>
            </BaseCard>
            <BaseCard {...args}>
                <BaseCardBody>
                    <p className="e-m-0">Right — flex: grow fills the row.</p>
                </BaseCardBody>
            </BaseCard>
        </div>
    ),
};

export const DashkitBodyWithoutPadding: Story = {
    args: { ui: 'dashkit' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardHeader>
                <BaseCardTitle>Tabular content</BaseCardTitle>
            </BaseCardHeader>
            <BaseCardBody className="e-p-0">
                <table className="e-w-full">
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="e-px-dk-4 e-py-2 e-text-left">Label</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-px-dk-4 e-py-2 e-text-right">Value</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-px-dk-4 e-py-2">Slot</BaseTable.Cell>
                            <BaseTable.Cell className="e-px-dk-4 e-py-2 e-text-right">123,456</BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell className="e-px-dk-4 e-py-2">Epoch</BaseTable.Cell>
                            <BaseTable.Cell className="e-px-dk-4 e-py-2 e-text-right">789</BaseTable.Cell>
                        </BaseTable.Row>
                    </BaseTable.Body>
                </table>
            </BaseCardBody>
        </BaseCard>
    ),
};

export const TwDefault: Story = {
    args: { ui: 'tw', variant: 'default' },
    render: args => (
        <BaseCard {...args}>
            <BaseCardTitle>Card Title</BaseCardTitle>
            <BaseCardDescription>OKLCH/Tailwind-styled card; same component, different lineage.</BaseCardDescription>
        </BaseCard>
    ),
};

export const TwComplete: Story = {
    args: { ui: 'tw', variant: 'default' },
    render: args => (
        <BaseCard {...args} className="e-w-full e-max-w-md">
            <BaseCardHeader>
                <BaseCardTitle>Complete Card</BaseCardTitle>
                <BaseCardDescription>Header + Body + Footer in the tw lineage.</BaseCardDescription>
            </BaseCardHeader>
            <BaseCardBody>
                <p className="e-mb-4">Switch the `ui` arg to `dashkit` to see the dashkit-faithful render.</p>
            </BaseCardBody>
            <BaseCardFooter>
                <button className="e-rounded e-bg-neutral-800 e-px-3 e-py-1 e-text-white">Action</button>
            </BaseCardFooter>
        </BaseCard>
    ),
};
