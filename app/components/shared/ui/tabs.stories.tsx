import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
    component: Tabs,
    decorators: [
        Story => (
            <div className="e-w-96">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Tabs',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const firstTab = canvas.getByRole('tab', { name: 'Account' });
        expect(firstTab).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Password' }));
        const passwordContent = await canvas.findByText('Change your password here.');
        expect(passwordContent).toBeInTheDocument();
    },
    render: () => (
        <Tabs defaultValue="account">
            <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <div className="e-mt-4 e-space-y-2">
                    <h3 className="e-text-lg e-font-semibold">Account</h3>
                    <p className="e-text-sm e-text-neutral-400">
                        Make changes to your account here. Click save when you&apos;re done.
                    </p>
                </div>
            </TabsContent>
            <TabsContent value="password">
                <div className="e-mt-4 e-space-y-2">
                    <h3 className="e-text-lg e-font-semibold">Password</h3>
                    <p className="e-text-sm e-text-neutral-400">Change your password here.</p>
                </div>
            </TabsContent>
            <TabsContent value="settings">
                <div className="e-mt-4 e-space-y-2">
                    <h3 className="e-text-lg e-font-semibold">Settings</h3>
                    <p className="e-text-sm e-text-neutral-400">Manage your settings and preferences.</p>
                </div>
            </TabsContent>
        </Tabs>
    ),
};

export const ManyTabs: Story = {
    render: () => {
        const tabs = [
            { content: 'Content for tab 1', label: 'Tab 1', value: 'tab1' },
            { content: 'Content for tab 2', label: 'Tab 2', value: 'tab2' },
            { content: 'Content for tab 3', label: 'Tab 3', value: 'tab3' },
            { content: 'Content for tab 4', label: 'Tab 4', value: 'tab4' },
            { content: 'Content for tab 5', label: 'Tab 5', value: 'tab5' },
        ];

        return (
            <Tabs defaultValue={tabs[0].value}>
                <TabsList>
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map(tab => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <div className="e-mt-4">
                            <p className="e-text-sm e-text-neutral-400">{tab.content}</p>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        );
    },
};

export const WithLongContent: Story = {
    render: () => (
        <Tabs defaultValue="overview">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <div className="e-mt-4 e-space-y-4">
                    <h3 className="e-text-lg e-font-semibold">Overview</h3>
                    <div className="e-space-y-2">
                        <p className="e-text-sm e-text-neutral-400">
                            This tab contains longer content to demonstrate how tabs handle substantial amounts of
                            information. You can include multiple paragraphs, lists, and other elements.
                        </p>
                        <ul className="e-list-inside e-list-disc e-space-y-1 e-text-sm e-text-neutral-400">
                            <li>First item with some additional information</li>
                            <li>Second item explaining another concept</li>
                            <li>Third item with more details</li>
                        </ul>
                        <p className="e-text-sm e-text-neutral-400">
                            The content area will expand to accommodate all the content, and you can scroll within it if
                            needed.
                        </p>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="details">
                <div className="e-mt-4">
                    <h3 className="e-text-lg e-font-semibold">Details</h3>
                    <p className="e-mt-2 e-text-sm e-text-neutral-400">Detailed information goes here.</p>
                </div>
            </TabsContent>
            <TabsContent value="history">
                <div className="e-mt-4">
                    <h3 className="e-text-lg e-font-semibold">History</h3>
                    <p className="e-mt-2 e-text-sm e-text-neutral-400">Historical data and records.</p>
                </div>
            </TabsContent>
        </Tabs>
    ),
};

export const Controlled: Story = {
    render: () => {
        const ControlledTabs = () => {
            const [value, setValue] = React.useState('tab1');

            return (
                <div className="e-space-y-4">
                    <div className="e-text-sm e-text-neutral-400">Current tab: {value}</div>
                    <Tabs value={value} onValueChange={setValue}>
                        <TabsList>
                            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tab1">
                            <div className="e-mt-4">
                                <p className="e-text-sm e-text-neutral-400">Content for tab 1</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="tab2">
                            <div className="e-mt-4">
                                <p className="e-text-sm e-text-neutral-400">Content for tab 2</p>
                            </div>
                        </TabsContent>
                        <TabsContent value="tab3">
                            <div className="e-mt-4">
                                <p className="e-text-sm e-text-neutral-400">Content for tab 3</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            );
        };

        return <ControlledTabs />;
    },
};

export const DisabledTab: Story = {
    render: () => (
        <Tabs defaultValue="active">
            <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="disabled" disabled>
                    Disabled
                </TabsTrigger>
                <TabsTrigger value="another">Another</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
                <div className="e-mt-4">
                    <p className="e-text-sm e-text-neutral-400">This tab is active and clickable.</p>
                </div>
            </TabsContent>
            <TabsContent value="disabled">
                <div className="e-mt-4">
                    <p className="e-text-sm e-text-neutral-400">
                        This content won&apos;t be accessible because the tab is disabled.
                    </p>
                </div>
            </TabsContent>
            <TabsContent value="another">
                <div className="e-mt-4">
                    <p className="e-text-sm e-text-neutral-400">Another active tab.</p>
                </div>
            </TabsContent>
        </Tabs>
    ),
};
