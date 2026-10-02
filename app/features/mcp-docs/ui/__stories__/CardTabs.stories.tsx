import type { Meta, StoryObj } from '@storybook-config/types';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { CardTabs } from '../CardTabs';

const ITEMS = [
    { id: 'request', label: 'Request' },
    { id: 'response', label: 'Response' },
    { id: 'errors', label: 'Errors' },
];

function CardTabsHarness() {
    const [value, setValue] = useState(ITEMS[0].id);
    return (
        <div className="w-[320px] border border-solid border-dark-border bg-outer-space-950 px-5">
            <CardTabs items={ITEMS} onChange={setValue} value={value} />
        </div>
    );
}

const meta: Meta<typeof CardTabs> = {
    component: CardTabs,
    parameters: { layout: 'padded' },
    render: () => <CardTabsHarness />,
    tags: ['autodocs', 'test'],
    title: 'Features/McpDocs/CardTabs',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SelectTab: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const response = canvas.getByRole('tab', { name: 'Response' });
        await userEvent.click(response);
        await expect(response).toHaveAttribute('aria-selected', 'true');
    },
};
