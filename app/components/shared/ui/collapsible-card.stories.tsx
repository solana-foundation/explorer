import type { Meta, StoryObj } from '@storybook/react';

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
    <div className="table-responsive e-mb-0">
        <table className="table table-sm table-nowrap card-table">
            <thead>
                <tr>
                    <th className="text-muted">Name</th>
                    <th className="text-muted">Value</th>
                </tr>
            </thead>
            <tbody className="list">
                <tr>
                    <td>Account #1</td>
                    <td className="e-text-right">Gzf3…k9Pq</td>
                </tr>
                <tr>
                    <td>Account #2</td>
                    <td className="e-text-right">5xRt…mN7v</td>
                </tr>
                <tr>
                    <td>Account #3</td>
                    <td className="e-text-right">BqWu…dL2j</td>
                </tr>
            </tbody>
        </table>
    </div>
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
