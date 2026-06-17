import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import React from 'react';

import { NavbarItem, NavbarLink, NavbarList } from '../Navbar';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const meta: Meta = {
    decorators: [withViewportFromGlobal],
    parameters: {
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Shared/Navbar@Media',
};

export default meta;
type Story = StoryObj;

const ITEMS = [
    { active: false, href: '/feature-gates', label: 'Feature Gates' },
    { active: true, href: '/tx/inspector', label: 'Inspector' },
    { active: false, href: '/about', label: 'About' },
];

const render = () => (
    <NavbarList>
        {ITEMS.map(item => (
            <NavbarItem key={item.href}>
                <NavbarLink href={item.href} active={item.active}>
                    {item.label}
                </NavbarLink>
            </NavbarItem>
        ))}
    </NavbarList>
);

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
