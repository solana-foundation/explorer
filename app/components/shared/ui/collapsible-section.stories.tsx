import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, userEvent, within } from 'storybook/test';

import { CollapsibleSection } from './collapsible-section';

const meta: Meta<typeof CollapsibleSection> = {
    args: {
        children: (
            <div style={{ color: '#ccc', padding: '16px' }}>Section content goes here. This is a collapsible area.</div>
        ),
        title: 'Section Title',
    },
    component: CollapsibleSection,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/CollapsibleSection',
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

// The home page's stats row: two sections side by side, the shorter card stretched to the taller one.
export const FillInGrid: Story = {
    play: async ({ canvasElement }) => {
        const [short, tall] = Array.from(canvasElement.querySelectorAll('section')).map(
            section => section.lastElementChild?.getBoundingClientRect().height,
        );
        expect(short).toBe(tall);
    },
    render: args => (
        <div className="grid grid-cols-2 gap-x-6">
            <CollapsibleSection {...args} collapsible={false} fill />
            <CollapsibleSection {...args} collapsible={false} fill title="Taller section">
                <div style={{ color: '#ccc', height: '200px', padding: '16px' }}>Taller content.</div>
            </CollapsibleSection>
        </div>
    ),
};
