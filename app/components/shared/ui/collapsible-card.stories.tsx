import type { Meta, StoryObj } from '@storybook/react';

import { BaseTable } from '@/app/shared/ui/Table';

import { Badge } from './badge';
import { Button } from './button';
import { CollapsibleCard } from './collapsible-card';

const meta: Meta<typeof CollapsibleCard> = {
    argTypes: {
        collapsible: {
            control: 'boolean',
        },
        defaultExpanded: {
            control: 'boolean',
        },
    },
    component: CollapsibleCard,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    title: 'Components/Shared/UI/CollapsibleCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
    <BaseTable ui="dashkit" variant="card" nowrap>
        <BaseTable.Head>
            <BaseTable.Row>
                <BaseTable.HeaderCell className="e-text-dk-gray-700">Name</BaseTable.HeaderCell>
                <BaseTable.HeaderCell className="e-text-dk-gray-700">Value</BaseTable.HeaderCell>
            </BaseTable.Row>
        </BaseTable.Head>
        <BaseTable.Body>
            <BaseTable.Row>
                <BaseTable.Cell>Account #1</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">Gzf3…k9Pq</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Account #2</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">5xRt…mN7v</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Account #3</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">BqWu…dL2j</BaseTable.Cell>
            </BaseTable.Row>
        </BaseTable.Body>
    </BaseTable>
);

export const Default: Story = {
    args: {} as never,
    render: () => (
        <CollapsibleCard title="Account List (3)">
            <SampleContent />
        </CollapsibleCard>
    ),
};

export const StartsCollapsed: Story = {
    args: {} as never,
    render: () => (
        <CollapsibleCard title="Account List (3)" defaultExpanded={false}>
            <SampleContent />
        </CollapsibleCard>
    ),
};

export const WithHeaderButtons: Story = {
    args: {} as never,
    render: () => (
        <CollapsibleCard
            title="Account Input(s) (3)"
            headerButtons={
                <Button ui="dashkit" variant="white" size="sm" className="e-mr-1.5 e-flex e-items-center">
                    Raw
                </Button>
            }
        >
            <SampleContent />
        </CollapsibleCard>
    ),
};

export const NonCollapsible: Story = {
    args: {} as never,
    render: () => (
        <CollapsibleCard title="Token Balances" collapsible={false}>
            <SampleContent />
        </CollapsibleCard>
    ),
};

export const WithBadgeTitle: Story = {
    args: {} as never,
    render: () => (
        <CollapsibleCard
            collapsible
            title={
                <>
                    <Badge ui="dashkit" variant="success" className="e-mr-1.5">
                        #1
                    </Badge>
                    Token Program: Transfer
                </>
            }
        >
            <SampleContent />
        </CollapsibleCard>
    ),
};
