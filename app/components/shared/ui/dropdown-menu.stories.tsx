/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import type { Meta, StoryObj } from '@storybook/react';
import { ChevronDown, Download, Edit, LogOut, Settings, Trash, User } from 'react-feather';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './dropdown-menu';

const meta: Meta<typeof DropdownMenu> = {
    component: DropdownMenu,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/DropdownMenu',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { hidden: true, name: /open menu/i });
        expect(trigger).toBeInTheDocument();
    },
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Open Menu
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Option 1</DropdownMenuItem>
                <DropdownMenuItem>Option 2</DropdownMenuItem>
                <DropdownMenuItem>Option 3</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const WithIcons: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Actions
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>
                    <User size={14} />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings size={14} />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Download size={14} />
                    Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut size={14} />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const WithShortcuts: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Edit
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>
                    <Edit size={14} />
                    Edit
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    Copy
                    <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    Paste
                    <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Trash size={14} />
                    Delete
                    <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const WithGroups: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Account
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="e-w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <User size={14} />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings size={14} />
                        Settings
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogOut size={14} />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const WithCheckboxItems: Story = {
    render: function Render() {
        const [showTimestamps, setShowTimestamps] = React.useState(true);
        const [showBalances, setShowBalances] = React.useState(false);

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        View Options
                        <ChevronDown size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={showTimestamps} onCheckedChange={setShowTimestamps}>
                        Timestamps
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showBalances} onCheckedChange={setShowBalances}>
                        Balances
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    },
};

import * as React from 'react';

export const WithRadioItems: Story = {
    render: function Render() {
        const [encoding, setEncoding] = React.useState('base64');

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        Encoding: {encoding}
                        <ChevronDown size={14} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Select encoding</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={encoding} onValueChange={setEncoding}>
                        <DropdownMenuRadioItem value="hex">Hex</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="base58">Base58</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="base64">Base64</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    },
};

export const WithSubmenu: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    More
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Action 1</DropdownMenuItem>
                <DropdownMenuItem>Action 2</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Download as</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem>Hex</DropdownMenuItem>
                        <DropdownMenuItem>Base58</DropdownMenuItem>
                        <DropdownMenuItem>Base64</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const DisabledItems: Story = {
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Options
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Enabled action</DropdownMenuItem>
                <DropdownMenuItem disabled>Disabled action</DropdownMenuItem>
                <DropdownMenuItem>Another enabled action</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const AlignEnd: Story = {
    render: () => (
        <div className="e-flex e-w-96 e-justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Download size={12} />
                        Download
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Download hex</DropdownMenuItem>
                    <DropdownMenuItem>Download base58</DropdownMenuItem>
                    <DropdownMenuItem>Download base64</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    ),
};

export const OpenByDefault: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { hidden: true, name: /open menu/i });
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
    render: () => (
        <DropdownMenu defaultOpen>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Open Menu
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Option 1</DropdownMenuItem>
                <DropdownMenuItem>Option 2</DropdownMenuItem>
                <DropdownMenuItem>Option 3</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};

export const Interactive: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { hidden: true, name: /click to open/i });
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('data-state', 'open');
    },
    render: () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Click to open
                    <ChevronDown size={14} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>Option 1</DropdownMenuItem>
                <DropdownMenuItem>Option 2</DropdownMenuItem>
                <DropdownMenuItem>Option 3</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ),
};
