import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

const meta: Meta<typeof Accordion> = {
    argTypes: {
        collapsible: {
            control: 'boolean',
        },
        type: {
            control: 'select',
            options: ['single', 'multiple'],
        },
    },
    component: Accordion,
    decorators: [
        Story => (
            <div className="e-w-96">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Accordion',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {
    args: {} as never,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const accordion = canvas.getByText('Is it accessible?');
        expect(accordion).toBeInTheDocument();
    },
    render: () => (
        <Accordion type="single" collapsible className="e-w-full e-max-w-md">
            <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern and uses semantic HTML elements.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    ),
} satisfies Story;

export const SingleCollapsible = {
    args: {} as never,
    render: () => (
        <Accordion type="single" collapsible className="e-w-full e-max-w-md">
            <AccordionItem value="item-1">
                <AccordionTrigger>What is an accordion?</AccordionTrigger>
                <AccordionContent>
                    An accordion is a vertically stacked set of interactive headings that each contain a title, content
                    snippet, or thumbnail representing a section of content. The headings function as controls that
                    enable users to reveal or hide their associated sections of content.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>How does it work?</AccordionTrigger>
                <AccordionContent>
                    Clicking on an accordion header expands or collapses the section. Only one section can be open at a
                    time in a single accordion, but you can have multiple accordions on a page.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Can I customize it?</AccordionTrigger>
                <AccordionContent>
                    Yes! You can customize the styling, animations, and behavior of the accordion to match your design
                    system.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    ),
} satisfies Story;

export const Multiple = {
    args: {} as never,
    render: () => (
        <Accordion type="multiple" className="e-w-full e-max-w-md">
            <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>
                    This is the content for section 1. Multiple sections can be open at the same time.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>
                    This is the content for section 2. You can expand multiple items simultaneously.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Section 3</AccordionTrigger>
                <AccordionContent>
                    This is the content for section 3. All items can be expanded or collapsed independently.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    ),
} satisfies Story;

export const DefaultValue = {
    args: {} as never,
    render: () => (
        <Accordion type="single" defaultValue="item-2" collapsible className="e-w-full e-max-w-md">
            <AccordionItem value="item-1">
                <AccordionTrigger>Closed by default</AccordionTrigger>
                <AccordionContent>This item starts closed.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Open by default</AccordionTrigger>
                <AccordionContent>This item starts open because it&apos;s set as the default value.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Also closed</AccordionTrigger>
                <AccordionContent>This item also starts closed.</AccordionContent>
            </AccordionItem>
        </Accordion>
    ),
} satisfies Story;

export const WithLongContent = {
    args: {} as never,
    render: () => (
        <Accordion type="single" collapsible className="e-w-full e-max-w-md">
            <AccordionItem value="item-1">
                <AccordionTrigger>Long content example</AccordionTrigger>
                <AccordionContent>
                    <div className="e-space-y-2">
                        <p>
                            This accordion item contains longer content to demonstrate how the component handles
                            substantial amounts of text and nested elements.
                        </p>
                        <ul className="e-list-inside e-list-disc e-space-y-1">
                            <li>First bullet point with some additional information</li>
                            <li>Second bullet point explaining another concept</li>
                            <li>Third bullet point with more details</li>
                        </ul>
                        <p>
                            The accordion content area will expand to accommodate all the content, and you can scroll
                            within it if needed.
                        </p>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Another item</AccordionTrigger>
                <AccordionContent>
                    <p>This is a shorter content section for comparison.</p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    ),
};

export const ManyItems = {
    args: {} as never,
    render: () => {
        const items = [
            { content: 'Content for the first accordion item.', title: 'First Item', value: 'item-1' },
            { content: 'Content for the second accordion item.', title: 'Second Item', value: 'item-2' },
            { content: 'Content for the third accordion item.', title: 'Third Item', value: 'item-3' },
            { content: 'Content for the fourth accordion item.', title: 'Fourth Item', value: 'item-4' },
            { content: 'Content for the fifth accordion item.', title: 'Fifth Item', value: 'item-5' },
            { content: 'Content for the sixth accordion item.', title: 'Sixth Item', value: 'item-6' },
        ];

        return (
            <Accordion type="single" collapsible className="e-w-full e-max-w-md">
                {items.map(item => (
                    <AccordionItem key={item.value} value={item.value}>
                        <AccordionTrigger>{item.title}</AccordionTrigger>
                        <AccordionContent>{item.content}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    },
} satisfies Story;
