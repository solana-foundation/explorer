import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { expect, userEvent, within } from 'storybook/test';

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
            <div className="e-flex e-min-h-96 e-items-center e-justify-center">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Switch',
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
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-items-center e-gap-2">
                <Switch disabled />
                <label className="e-text-sm e-text-neutral-400">Disabled unchecked</label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch checked disabled />
                <label className="e-text-sm e-text-neutral-400">Disabled checked</label>
            </div>
        </div>
    ),
};

export const WithLabel: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="notifications" />
                <label htmlFor="notifications" className="e-cursor-pointer e-text-sm e-font-medium">
                    Enable notifications
                </label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="marketing" checked />
                <label htmlFor="marketing" className="e-cursor-pointer e-text-sm e-font-medium">
                    Receive marketing emails
                </label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="updates" />
                <label htmlFor="updates" className="e-cursor-pointer e-text-sm e-font-medium">
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
                <div className="e-flex e-flex-col e-gap-4">
                    <div className="e-flex e-items-center e-gap-2">
                        <Switch checked={checked} onCheckedChange={setChecked} />
                        <label className="e-text-sm e-font-medium">{checked ? 'Switch is ON' : 'Switch is OFF'}</label>
                    </div>
                    <button
                        className="e-rounded e-border e-border-neutral-300 e-bg-white e-px-3 e-py-1 e-text-sm hover:e-bg-neutral-50"
                        onClick={() => setChecked(!checked)}
                    >
                        Toggle Switch
                    </button>
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
            <div className="e-flex e-flex-col e-gap-3">
                {settings.map(setting => (
                    <div key={setting.id} className="e-flex e-items-center e-gap-2">
                        <Switch id={setting.id} defaultChecked={setting.defaultChecked} />
                        <label htmlFor={setting.id} className="e-cursor-pointer e-text-sm e-font-medium">
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
        <div className="e-flex e-flex-col e-gap-2">
            <div className="e-flex e-items-start e-gap-3">
                <Switch id="privacy" className="e-mt-1" />
                <div className="e-flex e-flex-col">
                    <label htmlFor="privacy" className="e-cursor-pointer e-text-sm e-font-medium">
                        Enable privacy mode
                    </label>
                    <p className="e-mt-1 e-text-xs e-text-neutral-400">
                        When enabled, your activity will be hidden from other users.
                    </p>
                </div>
            </div>
            <div className="e-flex e-items-start e-gap-3">
                <Switch id="analytics" className="e-mt-1" defaultChecked />
                <div className="e-flex e-flex-col">
                    <label htmlFor="analytics" className="e-cursor-pointer e-text-sm e-font-medium">
                        Share analytics data
                    </label>
                    <p className="e-mt-1 e-text-xs e-text-neutral-400">
                        Help us improve by sharing anonymous usage statistics.
                    </p>
                </div>
            </div>
        </div>
    ),
};
