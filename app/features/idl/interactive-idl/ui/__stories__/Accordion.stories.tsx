import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../Accordion';

// unparameterized Meta: Radix Accordion props are a single|multiple union, which collapses StoryObj args to never
const meta: Meta = {
    component: Accordion,
    decorators: [
        Story => (
            <div className="w-96">
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Interactive IDL/UI/Accordion',
};

export default meta;
type Story = StoryObj<typeof meta>;

const Items = () => (
    <>
        <AccordionItem value="transfer">
            <AccordionTrigger>transfer</AccordionTrigger>
            <AccordionContent>
                <div className="px-6 pb-4">Transfers lamports between two accounts.</div>
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="initialize">
            <AccordionTrigger>initialize</AccordionTrigger>
            <AccordionContent>
                <div className="px-6 pb-4">Initializes a new account with the given seed.</div>
            </AccordionContent>
        </AccordionItem>
    </>
);

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('transfer')).toBeInTheDocument();
        // All items closed: triggers show "Expand" and content stays hidden
        await expect(canvas.getAllByText('Expand')).toHaveLength(2);
        await expect(canvas.queryByText('Transfers lamports between two accounts.')).not.toBeInTheDocument();
    },
    render: () => (
        <Accordion type="multiple">
            <Items />
        </Accordion>
    ),
};

export const Open: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Collapse')).toBeInTheDocument();
        await expect(canvas.getByText('Transfers lamports between two accounts.')).toBeVisible();
    },
    render: () => (
        <Accordion type="multiple" defaultValue={['transfer']}>
            <Items />
        </Accordion>
    ),
};

export const TogglesOnClick: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await userEvent.click(canvas.getByText('transfer'));
        await expect(canvas.getByText('Transfers lamports between two accounts.')).toBeVisible();
        await expect(canvas.getByText('Collapse')).toBeInTheDocument();

        await userEvent.click(canvas.getByText('transfer'));
        await expect(canvas.queryByText('Transfers lamports between two accounts.')).not.toBeInTheDocument();
    },
    render: () => (
        <Accordion type="multiple">
            <Items />
        </Accordion>
    ),
};
