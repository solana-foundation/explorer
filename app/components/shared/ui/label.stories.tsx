import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Input } from './input';
import { Label } from './label';
import { Switch } from './switch';

const meta: Meta<typeof Label> = {
    component: Label,
    decorators: [
        Story => (
            <div className="e-flex e-min-h-96 e-w-full e-max-w-md e-items-center e-justify-center">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Label',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const label = canvas.getByText('Email');
        expect(label).toBeInTheDocument();
    },
    render: () => (
        <div className="e-flex e-flex-col e-gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
        </div>
    ),
};

export const WithSwitch: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Enable notifications</Label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="marketing" defaultChecked />
                <Label htmlFor="marketing">Receive marketing emails</Label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="updates" />
                <Label htmlFor="updates">Auto-update applications</Label>
            </div>
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-flex-col e-gap-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" placeholder="Cannot type here" disabled />
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="disabled-switch" disabled />
                <Label htmlFor="disabled-switch">Disabled Switch</Label>
            </div>
            <div className="e-flex e-items-center e-gap-2">
                <Switch id="disabled-switch-checked" checked disabled />
                <Label htmlFor="disabled-switch-checked">Disabled Switch (Checked)</Label>
            </div>
        </div>
    ),
};

export const CustomStyling: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-flex-col e-gap-2">
                <Label htmlFor="custom-label" className="e-text-lg e-font-bold e-text-blue-500">
                    Custom Styled Label
                </Label>
                <Input id="custom-label" placeholder="Input with custom label" />
            </div>
            <div className="e-flex e-flex-col e-gap-2">
                <Label htmlFor="custom-label-2" className="e-text-xs e-font-light e-text-neutral-500">
                    Small Light Label
                </Label>
                <Input id="custom-label-2" placeholder="Input with small label" />
            </div>
        </div>
    ),
};
