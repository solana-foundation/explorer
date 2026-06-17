import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import { expect, within } from 'storybook/test';

import { TabsContent, TabsList, TabsTrigger } from '../Tabs';

const meta: Meta = {
    tags: ['autodocs', 'test'],
    title: 'Shared/Tabs',
};

export default meta;
type Story = StoryObj;

const TABS = [
    { content: 'First tab body — long enough text to wrap on narrow viewports.', id: 'one', label: 'Overview' },
    { content: 'Second tab body — accounts list goes here.', id: 'two', label: 'Accounts' },
    { content: 'Third tab body — disabled trigger above should not switch here.', id: 'three', label: 'Logs' },
];

function ControlledTabs({ disabledId, size }: { disabledId?: string; size?: 'sm' | 'default' }) {
    const [active, setActive] = useState('one');
    return (
        <div>
            <TabsList>
                {TABS.map(tab => (
                    <TabsTrigger
                        key={tab.id}
                        size={size}
                        active={active === tab.id}
                        disabled={disabledId === tab.id}
                        onClick={() => setActive(tab.id)}
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            <div className="pt-4">
                {TABS.map(tab => (
                    <TabsContent key={tab.id} active={active === tab.id}>
                        {tab.content}
                    </TabsContent>
                ))}
            </div>
        </div>
    );
}

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const [first] = within(canvasElement).getAllByRole('tab');
        await expect(first).toHaveAttribute('aria-selected', 'true');
    },
    render: () => <ControlledTabs />,
};

export const SmallSize: Story = {
    render: () => <ControlledTabs size="sm" />,
};

export const WithDisabledTrigger: Story = {
    render: () => <ControlledTabs disabledId="three" />,
};
