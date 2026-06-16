import type { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import React, { useState } from 'react';

import { TabsContent, TabsList, TabsTrigger } from '../Tabs';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Shared/UI/Tabs/Responsive',
};

export default meta;
type Story = StoryObj;

const TABS = [
    { content: 'Mobile overview content.', id: 'overview', label: 'Overview' },
    { content: 'Accounts list.', id: 'accounts', label: 'Accounts' },
    { content: 'Program logs.', id: 'logs', label: 'Logs' },
];

function ControlledTabs() {
    const [active, setActive] = useState('overview');
    return (
        <div>
            <TabsList>
                {TABS.map(tab => (
                    <TabsTrigger key={tab.id} active={active === tab.id} onClick={() => setActive(tab.id)}>
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

const render = () => <ControlledTabs />;

export const Mobile: Story = {
    globals: { viewport: { value: 'iphonex' } },
    render,
};

export const TabletPortrait: Story = {
    globals: { viewport: { value: 'ipad' } },
    render,
};

export const TabletLandscape: Story = {
    globals: { viewport: { isRotated: true, value: 'ipad' } },
    render,
};
