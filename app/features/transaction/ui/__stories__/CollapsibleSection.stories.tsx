import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { CollapsibleSection } from '../CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
    args: {
        children: (
            <div style={{ color: '#ccc', padding: '16px' }}>Section content goes here. This is a collapsible area.</div>
        ),
        title: 'Section Title',
    },
    component: CollapsibleSection,
    title: 'Components/Transaction/CollapsibleSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
    args: {
        defaultExpanded: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button');
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveAccessibleName('Collapse');
    },
};

export const Collapsed: Story = {
    args: {
        defaultExpanded: false,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(button).toHaveAccessibleName('Expand');
    },
};

export const ToggleBehavior: Story = {
    args: {
        defaultExpanded: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button');

        expect(button).toHaveAttribute('aria-expanded', 'true');

        await userEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(button);
        expect(button).toHaveAttribute('aria-expanded', 'true');
    },
};

export const WithId: Story = {
    args: {
        defaultExpanded: true,
        id: 'accounts',
        title: 'Accounts & SOL Balance',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const section = canvas.getByRole('region', { hidden: true });
        expect(section).toHaveAttribute('id', 'accounts');
    },
};
