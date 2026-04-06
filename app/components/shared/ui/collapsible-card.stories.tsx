import type { Meta, StoryObj } from '@storybook/react';

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
    decorators: [
        Story => (
            <div style={{ width: '600px' }}>
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/CollapsibleCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
    <div className="table-responsive mb-0">
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
                    <td className="text-lg-end">Gzf3…k9Pq</td>
                </tr>
                <tr>
                    <td>Account #2</td>
                    <td className="text-lg-end">5xRt…mN7v</td>
                </tr>
                <tr>
                    <td>Account #3</td>
                    <td className="text-lg-end">BqWu…dL2j</td>
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
            headerButtons={<button className="btn btn-sm btn-white d-flex align-items-center me-2">Raw</button>}
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
                    <span className="badge bg-success-soft me-2">#1</span>
                    Token Program: Transfer
                </>
            }
        >
            <SampleContent />
        </CollapsibleCard>
    ),
};
