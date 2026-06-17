import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
    argTypes: {
        checked: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
    component: Switch,
    decorators: [
        Story => (
            <div className="flex min-h-96 items-center justify-center">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Switch',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const switchElement = canvas.getByRole('switch');
        expect(switchElement).toBeInTheDocument();
        await userEvent.click(switchElement);
        expect(switchElement).toHaveAttribute('data-state', 'checked');
    },
    render: () => <Switch />,
};

export const Checked: Story = {
    args: {
        checked: true,
    },
    render: args => <Switch {...args} />,
};

export const Unchecked: Story = {
    args: {
        checked: false,
    },
    render: args => <Switch {...args} />,
};

export const Disabled: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Switch disabled />
                <label className="text-sm text-neutral-400">Disabled unchecked</label>
            </div>
            <div className="flex items-center gap-2">
                <Switch checked disabled />
                <label className="text-sm text-neutral-400">Disabled checked</label>
            </div>
        </div>
    ),
};

export const WithLabel: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Switch id="notifications" />
                <label htmlFor="notifications" className="cursor-pointer text-sm font-medium">
                    Enable notifications
                </label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="marketing" checked />
                <label htmlFor="marketing" className="cursor-pointer text-sm font-medium">
                    Receive marketing emails
                </label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="updates" />
                <label htmlFor="updates" className="cursor-pointer text-sm font-medium">
                    Auto-update applications
                </label>
            </div>
        </div>
    ),
};

export const Controlled: Story = {
    render: () => {
        const ControlledSwitch = () => {
            const [checked, setChecked] = React.useState(false);

            return (
                <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center gap-2">
                        <Switch checked={checked} onCheckedChange={setChecked} />
                        <label className="text-sm font-medium">{checked ? 'ON' : 'OFF'}</label>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setChecked(!checked)}>
                        Toggle Switch
                    </Button>
                </div>
            );
        };

        return <ControlledSwitch />;
    },
};

export const MultipleSwitches: Story = {
    render: () => {
        const settings = [
            { defaultChecked: true, id: 'email', label: 'Email notifications' },
            { defaultChecked: false, id: 'sms', label: 'SMS notifications' },
            { defaultChecked: true, id: 'push', label: 'Push notifications' },
            { defaultChecked: false, id: 'newsletter', label: 'Newsletter' },
        ];

        return (
            <div className="flex flex-col gap-3">
                {settings.map(setting => (
                    <div key={setting.id} className="flex items-center gap-2">
                        <Switch id={setting.id} defaultChecked={setting.defaultChecked} />
                        <label htmlFor={setting.id} className="cursor-pointer text-sm font-medium">
                            {setting.label}
                        </label>
                    </div>
                ))}
            </div>
        );
    },
};

export const WithDescription: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
                <Switch id="privacy" className="mt-1" />
                <div className="flex flex-col">
                    <label htmlFor="privacy" className="cursor-pointer text-sm font-medium">
                        Enable privacy mode
                    </label>
                    <p className="mt-1 text-xs text-neutral-400">
                        When enabled, your activity will be hidden from other users.
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <Switch id="analytics" className="mt-1" defaultChecked />
                <div className="flex flex-col">
                    <label htmlFor="analytics" className="cursor-pointer text-sm font-medium">
                        Share analytics data
                    </label>
                    <p className="mt-1 text-xs text-neutral-400">
                        Help us improve by sharing anonymous usage statistics.
                    </p>
                </div>
            </div>
        </div>
    ),
};
