import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Input } from './input';
import { Label } from './label';
import { Switch } from './switch';

const meta: Meta<typeof Label> = {
    component: Label,
    decorators: [
        Story => (
            <div className="flex min-h-96 w-full max-w-md items-center justify-center">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Label',
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
        <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
        </div>
    ),
};

export const WithSwitch: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Enable notifications</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="marketing" defaultChecked />
                <Label htmlFor="marketing">Receive marketing emails</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="updates" />
                <Label htmlFor="updates">Auto-update applications</Label>
            </div>
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" placeholder="Cannot type here" disabled />
            </div>
            <div className="flex items-center gap-2">
                <Switch id="disabled-switch" disabled />
                <Label htmlFor="disabled-switch">Disabled Switch</Label>
            </div>
            <div className="flex items-center gap-2">
                <Switch id="disabled-switch-checked" checked disabled />
                <Label htmlFor="disabled-switch-checked">Disabled Switch (Checked)</Label>
            </div>
        </div>
    ),
};

export const CustomStyling: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="custom-label" className="text-lg font-bold text-blue-500">
                    Custom Styled Label
                </Label>
                <Input id="custom-label" placeholder="Input with custom label" />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="custom-label-2" className="text-xs font-light text-neutral-500">
                    Small Light Label
                </Label>
                <Input id="custom-label-2" placeholder="Input with small label" />
            </div>
        </div>
    ),
};
