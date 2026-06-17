import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { expect, within } from 'storybook/test';

import { NavbarItem, NavbarLink, NavbarList } from '../Navbar';

const meta: Meta = {
    tags: ['autodocs', 'test'],
    title: 'Shared/Navbar',
};

export default meta;
type Story = StoryObj;

const ITEMS = [
    { active: false, href: '/feature-gates', label: 'Feature Gates' },
    { active: true, href: '/tx/inspector', label: 'Inspector' },
    { active: false, href: '/about', label: 'About' },
];

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const current = await within(canvasElement).findByRole('link', { name: 'Inspector' });
        await expect(current).toHaveAttribute('aria-current', 'page');
    },
    render: () => (
        <NavbarList>
            {ITEMS.map(item => (
                <NavbarItem key={item.href}>
                    <NavbarLink href={item.href} active={item.active}>
                        {item.label}
                    </NavbarLink>
                </NavbarItem>
            ))}
        </NavbarList>
    ),
};

export const AllInactive: Story = {
    render: () => (
        <NavbarList>
            {ITEMS.map(item => (
                <NavbarItem key={item.href}>
                    <NavbarLink href={item.href}>{item.label}</NavbarLink>
                </NavbarItem>
            ))}
        </NavbarList>
    ),
};
